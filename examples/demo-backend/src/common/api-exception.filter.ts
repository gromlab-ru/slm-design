import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { DemoRequest } from "./request.types";

interface HttpErrorBody {
  code?: string;
  message?: string | string[];
  details?: unknown[];
  error?: string;
}

const STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  422: "UNPROCESSABLE_ENTITY",
  429: "RATE_LIMITED",
  500: "INTERNAL_SERVER_ERROR",
};

@Injectable()
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>() as DemoRequest;
    const response = context.getResponse<Response>();
    const externalCode =
      typeof exception === "object" && exception !== null && "code" in exception
        ? String((exception as { code: unknown }).code)
        : undefined;
    const isOversizedFile = externalCode === "LIMIT_FILE_SIZE";
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : isOversizedFile
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const rawBody =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body: HttpErrorBody =
      typeof rawBody === "object" && rawBody !== null
        ? (rawBody as HttpErrorBody)
        : {};
    const validationMessages = Array.isArray(body.message) ? body.message : [];
    const publicMessage = isOversizedFile
      ? "Uploaded file exceeds the 5 MiB limit"
      : status === 500 && !(exception instanceof HttpException)
        ? "Internal server error"
        : Array.isArray(body.message)
          ? "Request validation failed"
          : (body.message ??
            (typeof rawBody === "string" ? rawBody : body.error) ??
            "Request failed");

    response.status(status).json({
      statusCode: status,
      code: isOversizedFile || status === HttpStatus.PAYLOAD_TOO_LARGE
        ? "FILE_TOO_LARGE"
        : (body.code ?? STATUS_CODES[status] ?? `HTTP_${status}`),
      message: publicMessage,
      details:
        body.details ?? validationMessages.map((message) => ({ message })),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      requestId: request.requestId ?? "unknown",
    });
  }
}
