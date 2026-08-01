import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createSimpleApplication } from "../src/apps/simple/bootstrap";

describe("Simple API", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const created = await createSimpleApplication(false);
    app = created.app;
    await app.init();
  });

  beforeEach(async () => {
    await request(app.getHttpServer())
      .post("/api/v1/testing/reset")
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email = "admin@demo.local") {
    return request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email, password: "demo1234" })
      .expect(200);
  }

  it("serves health, Swagger JSON and observable headers", async () => {
    const health = await request(app.getHttpServer())
      .get("/api/v1/health")
      .set("X-Request-Id", "frontend-request-001")
      .expect(200);

    expect(health.body.data).toMatchObject({
      application: "simple",
      status: "ok",
    });
    expect(health.headers["x-request-id"]).toBe("frontend-request-001");
    expect(health.headers["x-response-time"]).toMatch(/^\d+ms$/);

    const contract = await request(app.getHttpServer())
      .get("/openapi.json")
      .expect(200);
    expect(contract.body.info.title).toBe("Demo Simple API");
    expect(contract.body.components.securitySchemes.jwt).toBeDefined();
  });

  it("supports empty, large, error and rate-limit scenarios deterministically", async () => {
    const empty = await request(app.getHttpServer())
      .get("/api/v1/products")
      .set("X-Demo-Scenario", "empty")
      .expect(200);
    expect(empty.body.data).toEqual([]);
    expect(empty.body.meta.total).toBe(0);

    const large = await request(app.getHttpServer())
      .get("/api/v1/categories")
      .set("X-Demo-Scenario", "large-dataset")
      .expect(200);
    expect(large.body.data).toHaveLength(250);

    const limited = await request(app.getHttpServer())
      .get("/api/v1/products")
      .set("X-Demo-Scenario", "rate-limited")
      .expect(429);
    expect(limited.headers["retry-after"]).toBe("3");
    expect(limited.body.code).toBe("DEMO_RATE_LIMITED");

    const failed = await request(app.getHttpServer())
      .get("/api/v1/products")
      .set("X-Demo-Scenario", "server-error")
      .expect(500);
    expect(failed.body.code).toBe("DEMO_SERVER_ERROR");
  });

  it("authenticates, rotates refresh tokens and rejects token reuse", async () => {
    const authenticated = await login();
    const { accessToken, refreshToken } = authenticated.body.data.tokens;

    const me = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body.data.email).toBe("admin@demo.local");

    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("X-Demo-Scenario", "expired-auth")
      .expect(401);

    const rotated = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(200);
    expect(rotated.body.data.tokens.refreshToken).not.toBe(refreshToken);

    const reused = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken })
      .expect(401);
    expect(reused.body.code).toBe("REFRESH_TOKEN_REUSED");
  });

  it("returns 304 for a current product ETag", async () => {
    const first = await request(app.getHttpServer())
      .get("/api/v1/products/product-keyboard")
      .expect(200);
    expect(first.headers.etag).toBeDefined();

    await request(app.getHttpServer())
      .get("/api/v1/products/product-keyboard")
      .set("If-None-Match", first.headers.etag)
      .expect(304);
  });

  it("detects stale product updates and returns structured conflicts", async () => {
    const authenticated = await login();
    const accessToken = authenticated.body.data.tokens.accessToken as string;
    const authorization = `Bearer ${accessToken}`;

    const updated = await request(app.getHttpServer())
      .patch("/api/v1/products/product-keyboard")
      .set("Authorization", authorization)
      .send({ version: 1, name: "Mechanical Keyboard Updated" })
      .expect(200);
    expect(updated.body.data.version).toBe(2);

    const conflict = await request(app.getHttpServer())
      .patch("/api/v1/products/product-keyboard")
      .set("Authorization", authorization)
      .send({ version: 1, name: "Stale Update" })
      .expect(409);
    expect(conflict.body.code).toBe("PRODUCT_VERSION_CONFLICT");
    expect(conflict.body.requestId).toMatch(/^req-/);
  });

  it("enforces roles and validates nested orders", async () => {
    const customer = await login("customer@demo.local");
    const authorization = `Bearer ${customer.body.data.tokens.accessToken as string}`;

    await request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", authorization)
      .send({})
      .expect(403);

    const order = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", authorization)
      .send({
        items: [
          {
            productId: "product-keyboard",
            quantity: 1,
            expectedVersion: 1,
            expectedUnitPriceCents: 12990,
          },
        ],
      })
      .expect(201);
    expect(order.body.data.userId).toBe("user-customer");
    expect(order.body.data.totalCents).toBe(12990);
  });

  it("does not execute a timeout mutation after the client disconnects", async () => {
    const customer = await login("customer@demo.local");
    const authorization = `Bearer ${customer.body.data.tokens.accessToken as string}`;
    const ordersBefore = await request(app.getHttpServer())
      .get("/api/v1/orders")
      .set("Authorization", authorization)
      .expect(200);
    const previousDelay = process.env.MOCK_TIMEOUT_DELAY_MS;

    process.env.MOCK_TIMEOUT_DELAY_MS = "100";

    try {
      await request(app.getHttpServer())
        .post("/api/v1/orders")
        .set("Authorization", authorization)
        .set("X-Demo-Scenario", "timeout")
        .send({
          items: [
            {
              productId: "product-keyboard",
              quantity: 1,
              expectedVersion: 1,
              expectedUnitPriceCents: 12990,
            },
          ],
        })
        .timeout({ deadline: 10 });
    } catch {
      // The client intentionally closes the response before the mutation delay elapses.
    } finally {
      if (previousDelay === undefined) {
        delete process.env.MOCK_TIMEOUT_DELAY_MS;
      } else {
        process.env.MOCK_TIMEOUT_DELAY_MS = previousDelay;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    const ordersAfter = await request(app.getHttpServer())
      .get("/api/v1/orders")
      .set("Authorization", authorization)
      .expect(200);

    expect(ordersAfter.body.meta.total).toBe(ordersBefore.body.meta.total);
  });

  it("rejects an order when the confirmed product snapshot changed", async () => {
    const customer = await login("customer@demo.local");
    const authorization = `Bearer ${customer.body.data.tokens.accessToken as string}`;

    const response = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", authorization)
      .send({
        items: [
          {
            productId: "product-keyboard",
            quantity: 1,
            expectedVersion: 1,
            expectedUnitPriceCents: 1,
          },
        ],
      })
      .expect(409);

    expect(response.body.code).toBe("PRODUCT_CHANGED");
  });

  it("rejects duplicate product lines and unsupported order currency", async () => {
    const admin = await login();
    const adminAuthorization = `Bearer ${admin.body.data.tokens.accessToken as string}`;
    const customer = await login("customer@demo.local");
    const customerAuthorization = `Bearer ${customer.body.data.tokens.accessToken as string}`;
    const line = {
      productId: "product-keyboard",
      quantity: 20,
      expectedVersion: 1,
      expectedUnitPriceCents: 12990,
    };
    const duplicateResponse = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", customerAuthorization)
      .send({ items: [line, line] })
      .expect(422);

    expect(duplicateResponse.body.code).toBe("DUPLICATE_ORDER_PRODUCT");

    const eurProduct = await request(app.getHttpServer())
      .post("/api/v1/products")
      .set("Authorization", adminAuthorization)
      .send({
        name: "Euro Product",
        description: "A deterministic product priced in euros.",
        priceCents: 1000,
        currency: "EUR",
        categoryId: "category-books",
        stock: 5,
        imageUrl: "https://picsum.photos/seed/euro-product/640/480",
      })
      .expect(201);
    const currencyResponse = await request(app.getHttpServer())
      .post("/api/v1/orders")
      .set("Authorization", customerAuthorization)
      .send({
        items: [
          {
            productId: eurProduct.body.data.id,
            quantity: 1,
            expectedVersion: eurProduct.body.data.version,
            expectedUnitPriceCents: eurProduct.body.data.priceCents,
          },
        ],
      })
      .expect(422);

    expect(currencyResponse.body.code).toBe("UNSUPPORTED_ORDER_CURRENCY");
  });
});
