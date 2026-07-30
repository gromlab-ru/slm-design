import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ErrorResponseDto } from "./api.dto";

export function ApiStandardErrors(
  options: { auth?: boolean; notFound?: boolean; conflict?: boolean } = {},
) {
  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [
    ApiBadRequestResponse({
      description: "Invalid request or validation error.",
      type: ErrorResponseDto,
    }),
    ApiTooManyRequestsResponse({
      description: "Demo rate limit scenario.",
      type: ErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: "Unexpected or simulated server error.",
      type: ErrorResponseDto,
    }),
  ];

  if (options.auth) {
    decorators.push(
      ApiUnauthorizedResponse({
        description: "Authentication is missing or expired.",
        type: ErrorResponseDto,
      }),
      ApiForbiddenResponse({
        description: "The current user lacks permission.",
        type: ErrorResponseDto,
      }),
    );
  }

  if (options.notFound) {
    decorators.push(
      ApiNotFoundResponse({
        description: "The requested resource does not exist.",
        type: ErrorResponseDto,
      }),
    );
  }

  if (options.conflict) {
    decorators.push(
      ApiConflictResponse({
        description: "Business or optimistic-lock conflict.",
        type: ErrorResponseDto,
      }),
    );
  }

  return applyDecorators(...decorators);
}

export function ApiDemoScenarioHeader() {
  return ApiHeader({
    name: "X-Demo-Scenario",
    required: false,
    enum: [
      "normal",
      "slow",
      "timeout",
      "server-error",
      "rate-limited",
      "empty",
      "expired-auth",
      "forbidden",
      "conflict",
      "large-dataset",
    ],
    description:
      "Forces a deterministic frontend-testing scenario for this request.",
  });
}

export function ApiOrganizationHeader() {
  return ApiHeader({
    name: "X-Organization-Id",
    required: true,
    example: "org-acme",
    description: "Current tenant. The authenticated user must be a member.",
  });
}

export function ApiIdempotencyHeader() {
  return ApiHeader({
    name: "Idempotency-Key",
    required: true,
    example: "checkout-6c5f92ad",
    description:
      "Repeating a request with the same key returns the original order.",
  });
}

export function ApiBinaryResponse(
  description: string,
  mediaType = "application/octet-stream",
) {
  return ApiResponse({
    status: 200,
    description,
    content: {
      [mediaType]: {
        schema: { type: "string", format: "binary" },
      },
    },
  });
}
