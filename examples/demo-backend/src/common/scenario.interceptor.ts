import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { fromEvent, Observable, timer } from "rxjs";
import { delay, map, mergeMap, takeUntil } from "rxjs/operators";
import { DEMO_SCENARIOS, type DemoScenario } from "./api.dto";

function scenarioFromRequest(request: Request): DemoScenario {
  const value = String(request.headers["x-demo-scenario"] ?? "normal");
  return DEMO_SCENARIOS.includes(value as DemoScenario)
    ? (value as DemoScenario)
    : "normal";
}

export function assertNoForcedAuthFailure(request: Request): void {
  const scenario = scenarioFromRequest(request);
  if (scenario === "expired-auth") {
    throw new UnauthorizedException({
      code: "DEMO_AUTH_EXPIRED",
      message: "Authentication was expired by the demo scenario.",
    });
  }
  if (scenario === "forbidden") {
    throw new ForbiddenException({
      code: "DEMO_FORBIDDEN",
      message: "Access was denied by the demo scenario.",
    });
  }
}

@Injectable()
export class ScenarioInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const scenario = scenarioFromRequest(request);
    response.setHeader("X-Demo-Scenario", scenario);

    if (scenario === "server-error") {
      throw new InternalServerErrorException({
        code: "DEMO_SERVER_ERROR",
        message: "Server error forced by X-Demo-Scenario.",
      });
    }

    if (scenario === "rate-limited") {
      response.setHeader("Retry-After", "3");
      throw new HttpException(
        {
          code: "DEMO_RATE_LIMITED",
          message: "Rate limit forced by X-Demo-Scenario.",
        },
        429,
      );
    }

    if (
      scenario === "conflict" &&
      !["GET", "HEAD", "OPTIONS"].includes(request.method)
    ) {
      throw new ConflictException({
        code: "DEMO_CONFLICT",
        message: "Conflict forced by X-Demo-Scenario.",
      });
    }

    const configuredDelay =
      scenario === "slow"
        ? Number(process.env.MOCK_SLOW_DELAY_MS ?? 1500)
        : scenario === "timeout"
          ? Number(process.env.MOCK_TIMEOUT_DELAY_MS ?? 30000)
          : 0;
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const source =
      configuredDelay > 0 && isMutation
        ? timer(configuredDelay).pipe(
            takeUntil(fromEvent(response, "close")),
            mergeMap(() => next.handle()),
          )
        : next
            .handle()
            .pipe(
              configuredDelay > 0 ? delay(configuredDelay) : (value) => value,
            );

    return source.pipe(
      map((payload) => this.transformPayload(payload, scenario)),
    );
  }

  private transformPayload(payload: unknown, scenario: DemoScenario): unknown {
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      return payload;
    }

    const response = payload as {
      data: unknown;
      meta?: Record<string, unknown>;
    };
    if (!Array.isArray(response.data)) {
      return payload;
    }

    if (scenario === "empty") {
      return {
        ...response,
        data: [],
        meta: response.meta
          ? {
              ...response.meta,
              total: 0,
              totalPages: 0,
              nextCursor: null,
              hasMore: false,
            }
          : response.meta,
      };
    }

    if (scenario === "large-dataset" && response.data.length > 0) {
      const source = response.data as Array<Record<string, unknown>>;
      const data = Array.from({ length: 250 }, (_, index) => {
        const original = source[index % source.length];
        return {
          ...original,
          id: `${String(original.id ?? "item")}-scenario-${String(index + 1).padStart(3, "0")}`,
        };
      });
      return {
        ...response,
        data,
        meta: response.meta
          ? {
              ...response.meta,
              total: data.length,
              totalPages: 1,
              nextCursor: null,
              hasMore: false,
            }
          : response.meta,
      };
    }

    return payload;
  }
}
