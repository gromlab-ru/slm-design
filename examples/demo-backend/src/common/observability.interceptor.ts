import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Response } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = performance.now();
    const response = context.switchToHttp().getResponse<Response>();
    const setTiming = () => {
      if (!response.headersSent) {
        response.setHeader(
          "X-Response-Time",
          `${Math.round(performance.now() - startedAt)}ms`,
        );
      }
    };

    return next.handle().pipe(tap({ next: setTiming, error: setTiming }));
  }
}
