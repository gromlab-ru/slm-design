import type { AddressInfo } from "node:net";
import type { INestApplication } from "@nestjs/common";
import { io, type Socket } from "socket.io-client";
import request from "supertest";
import { createComplexApplication } from "../src/apps/complex/bootstrap";

interface AuthenticatedAgent {
  agent: ReturnType<typeof request.agent>;
  csrfToken: string;
  cookieHeader: string;
}

describe("Complex API", () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const created = await createComplexApplication(false);
    app = created.app;
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(async () => {
    await request(app.getHttpServer())
      .post("/api/v1/testing/reset")
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(
    email = "admin@complex.demo",
  ): Promise<AuthenticatedAgent> {
    const agent = request.agent(app.getHttpServer());
    const response = await agent
      .post("/api/v1/auth/login")
      .send({ email, password: "demo1234" })
      .expect(200);
    const setCookies = response.headers["set-cookie"] as unknown as string[];
    return {
      agent,
      csrfToken: response.body.data.csrfToken as string,
      cookieHeader: setCookies
        .map((cookie) => cookie.split(";", 1)[0])
        .join("; "),
    };
  }

  it("serves an isolated cookie-auth OpenAPI document", async () => {
    const contract = await request(app.getHttpServer())
      .get("/openapi.json")
      .expect(200);
    expect(contract.body.info.title).toBe("Demo Complex API");
    expect(
      contract.body.components.securitySchemes.cookieSession,
    ).toBeDefined();
    expect(contract.body.components.securitySchemes.csrf).toBeDefined();
    expect(contract.body.paths["/api/v1/organizations"]).toBeDefined();
  });

  it("establishes a cookie session and enforces tenant context", async () => {
    await request(app.getHttpServer()).get("/api/v1/users/me").expect(401);
    const authenticated = await login();

    const me = await authenticated.agent.get("/api/v1/users/me").expect(200);
    expect(me.body.data.email).toBe("admin@complex.demo");

    const missingTenant = await authenticated.agent
      .get("/api/v1/products")
      .expect(400);
    expect(missingTenant.body.code).toBe("ORGANIZATION_REQUIRED");

    const products = await authenticated.agent
      .get("/api/v1/products")
      .set("X-Organization-Id", "org-acme")
      .expect(200);
    expect(products.body.data[0].organizationId).toBe("org-acme");

    await authenticated.agent
      .get("/api/v1/products")
      .set("X-Organization-Id", "org-unknown")
      .expect(403);
  });

  it("enforces CSRF and optimistic product versions", async () => {
    const authenticated = await login();
    const url = "/api/v1/products/complex-product-keyboard";

    await authenticated.agent
      .patch(url)
      .set("X-Organization-Id", "org-acme")
      .send({ version: 3, name: "No CSRF" })
      .expect(403);

    const updated = await authenticated.agent
      .patch(url)
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .send({ version: 3, name: "Keyboard Enterprise" })
      .expect(200);
    expect(updated.body.data.version).toBe(4);

    const stale = await authenticated.agent
      .patch(url)
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .send({ version: 3, name: "Stale Keyboard" })
      .expect(409);
    expect(stale.body.code).toBe("PRODUCT_VERSION_CONFLICT");
  });

  it("creates orders idempotently", async () => {
    const authenticated = await login();
    const body = {
      customerId: "customer-ada",
      items: [
        {
          productId: "complex-product-keyboard",
          variantId: "variant-complex-product-keyboard-default",
          quantity: 1,
        },
      ],
      promotionCode: "WELCOME10",
    };
    const create = () =>
      authenticated.agent
        .post("/api/v1/orders")
        .set("X-Organization-Id", "org-acme")
        .set("X-CSRF-Token", authenticated.csrfToken)
        .set("Idempotency-Key", "checkout-test-001")
        .send(body)
        .expect(201);

    const first = await create();
    const second = await create();
    expect(second.body.data.id).toBe(first.body.data.id);
    expect(first.body.data.total.amount).toBe("116.91");
  });

  it("supports role changes without recreating the session", async () => {
    const authenticated = await login("viewer@complex.demo");
    await authenticated.agent
      .post("/api/v1/products")
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .send({})
      .expect(403);

    await request(app.getHttpServer())
      .post("/api/v1/testing/users/complex-user-viewer/role")
      .send({ role: "manager" })
      .expect(200);

    const allowedToReachValidation = await authenticated.agent
      .post("/api/v1/products")
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .send({})
      .expect(400);
    expect(allowedToReachValidation.body.code).toBe("BAD_REQUEST");
  });

  it("expires an active session on demand", async () => {
    const authenticated = await login();
    await authenticated.agent
      .post("/api/v1/testing/session/expire")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .expect(200);
    await authenticated.agent.get("/api/v1/users/me").expect(401);
  });

  it("runs a 202 background export and exposes the completed result", async () => {
    const authenticated = await login();
    const started = await authenticated.agent
      .post("/api/v1/exports/orders")
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .expect(202);
    const jobId = started.body.data.id as string;

    await authenticated.agent
      .get(`/api/v1/jobs/${jobId}/result`)
      .set("X-Organization-Id", "org-acme")
      .expect(409);

    await new Promise((resolve) => setTimeout(resolve, 850));
    const completed = await authenticated.agent
      .get(`/api/v1/jobs/${jobId}`)
      .set("X-Organization-Id", "org-acme")
      .expect(200);
    expect(completed.body.data).toMatchObject({
      status: "completed",
      progress: 100,
    });

    const result = await authenticated.agent
      .get(`/api/v1/jobs/${jobId}/result`)
      .set("X-Organization-Id", "org-acme")
      .expect(200);
    expect(result.headers["content-type"]).toMatch(/text\/csv/);
  });

  it("uploads and downloads a multipart file", async () => {
    const authenticated = await login();
    const uploaded = await authenticated.agent
      .post("/api/v1/files")
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .attach("file", Buffer.from("sku,stock\nABC,10\n"), "inventory.csv")
      .expect(201);
    expect(uploaded.body.data.name).toBe("inventory.csv");

    const downloaded = await authenticated.agent
      .get(`/api/v1/files/${uploaded.body.data.id as string}/download`)
      .set("X-Organization-Id", "org-acme")
      .expect(200);
    expect(downloaded.headers["content-disposition"]).toContain(
      "inventory.csv",
    );

    const tooLarge = await authenticated.agent
      .post("/api/v1/files")
      .set("X-Organization-Id", "org-acme")
      .set("X-CSRF-Token", authenticated.csrfToken)
      .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), "too-large.bin")
      .expect(413);
    expect(tooLarge.body.code).toBe("FILE_TOO_LARGE");
  });

  it("authenticates Socket.IO with the session cookie and deduplicates messages", async () => {
    const authenticated = await login();
    const socket = io(`${baseUrl}/chat`, {
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
      extraHeaders: { Cookie: authenticated.cookieHeader },
    });

    await waitForSocketEvent(socket, "connect");
    const joined = waitForSocketEvent<{ conversationId: string }>(
      socket,
      "chat:joined",
    );
    socket.emit("chat:join", {
      organizationId: "org-acme",
      conversationId: "conversation-support",
    });
    expect((await joined).conversationId).toBe("conversation-support");

    const messagePayload = {
      organizationId: "org-acme",
      conversationId: "conversation-support",
      text: "Socket E2E message",
      clientMessageId: "socket-e2e-001",
    };
    const firstAck = waitForSocketEvent<{ id: string }>(socket, "message:ack");
    socket.emit("message:send", messagePayload);
    const first = await firstAck;

    const secondAck = waitForSocketEvent<{ id: string }>(socket, "message:ack");
    socket.emit("message:send", messagePayload);
    const second = await secondAck;
    expect(second.id).toBe(first.id);
    socket.disconnect();
  }, 10_000);
});

function waitForSocketEvent<T = void>(
  socket: Socket,
  event: string,
  timeoutMs = 3000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for Socket.IO event ${event}.`));
    }, timeoutMs);
    const handler = (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    };
    socket.once(event, handler);
  });
}
