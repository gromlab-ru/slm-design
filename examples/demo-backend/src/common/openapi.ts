import type { INestApplication } from "@nestjs/common";
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from "@nestjs/swagger";

interface OpenApiOptions {
  kind: "simple" | "complex";
  port: number;
}

export function createOpenApiDocument(
  app: INestApplication,
  options: OpenApiOptions,
): OpenAPIObject {
  const isSimple = options.kind === "simple";
  const builder = new DocumentBuilder()
    .setTitle(isSimple ? "Demo Simple API" : "Demo Complex API")
    .setDescription(
      isSimple
        ? "JWT-based API for landing pages and medium frontend applications."
        : "Cookie-session, multitenant and realtime API for large frontend applications.",
    )
    .setVersion("1.0.0")
    .addServer(`http://localhost:${options.port}`, "Local development");

  if (isSimple) {
    builder.addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "jwt",
    );
  } else {
    builder
      .addCookieAuth(
        "demo_session",
        { type: "apiKey", in: "cookie" },
        "cookieSession",
      )
      .addApiKey(
        {
          type: "apiKey",
          in: "header",
          name: "X-CSRF-Token",
          description: "Required for authenticated mutations.",
        },
        "csrf",
      );
  }

  return SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, "")}_${methodKey}`,
  });
}

export function mountOpenApi(
  app: INestApplication,
  document: OpenAPIObject,
  title: string,
): void {
  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "/openapi.json",
    customSiteTitle: title,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  });
}
