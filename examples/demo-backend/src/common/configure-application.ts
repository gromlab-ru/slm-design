import { randomUUID } from "node:crypto";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import { ApiExceptionFilter } from "./api-exception.filter";
import { ObservabilityInterceptor } from "./observability.interceptor";
import type { DemoRequest } from "./request.types";
import { ScenarioInterceptor } from "./scenario.interceptor";

export function configureApplication(app: NestExpressApplication): void {
  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const demoRequest = request as DemoRequest;
    demoRequest.requestId = String(
      request.headers["x-request-id"] ?? `req-${randomUUID()}`,
    );
    response.setHeader("X-Request-Id", demoRequest.requestId);
    next();
  });
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Demo-Scenario",
      "X-Organization-Id",
      "X-Request-Id",
      "Idempotency-Key",
      "If-None-Match",
    ],
    exposedHeaders: [
      "ETag",
      "Retry-After",
      "X-Request-Id",
      "X-Response-Time",
      "X-Demo-Scenario",
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(app.get(ApiExceptionFilter));
  app.useGlobalInterceptors(
    app.get(ObservabilityInterceptor),
    app.get(ScenarioInterceptor),
  );
  app.enableShutdownHooks();
}
