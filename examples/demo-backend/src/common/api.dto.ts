import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ErrorDetailDto {
  @ApiPropertyOptional({ example: "email" })
  field?: string;

  @ApiProperty({ example: "must be an email" })
  message!: string;

  @ApiPropertyOptional({ example: "isEmail" })
  code?: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: "PRODUCT_NOT_FOUND" })
  code!: string;

  @ApiProperty({ example: "Product not found" })
  message!: string;

  @ApiProperty({ type: [ErrorDetailDto] })
  details!: ErrorDetailDto[];

  @ApiProperty({ format: "date-time", example: "2026-07-30T12:00:00.000Z" })
  timestamp!: string;

  @ApiProperty({ example: "/api/v1/products/product-404" })
  path!: string;

  @ApiProperty({ example: "req-5c9f7a3d" })
  requestId!: string;
}

export class PageMetaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 20, minimum: 1 })
  limit!: number;

  @ApiProperty({ example: 48, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPages!: number;
}

export class CursorMetaDto {
  @ApiProperty({ example: 20, minimum: 1 })
  limit!: number;

  @ApiPropertyOptional({ nullable: true, example: "product-020" })
  nextCursor!: string | null;

  @ApiProperty({ example: true })
  hasMore!: boolean;
}

export class MutationResultDto {
  @ApiProperty({ example: "product-001" })
  id!: string;

  @ApiProperty({ example: true })
  success!: boolean;
}

export class MutationResponseDto {
  @ApiProperty({ type: MutationResultDto })
  data!: MutationResultDto;
}

export class HealthDataDto {
  @ApiProperty({ enum: ["simple", "complex"], example: "simple" })
  application!: "simple" | "complex";

  @ApiProperty({ enum: ["ok"], example: "ok" })
  status!: "ok";

  @ApiProperty({ format: "date-time" })
  timestamp!: string;

  @ApiProperty({ example: "1.0.0" })
  version!: string;
}

export class HealthResponseDto {
  @ApiProperty({ type: HealthDataDto })
  data!: HealthDataDto;
}

export const DEMO_SCENARIOS = [
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
] as const;

export type DemoScenario = (typeof DEMO_SCENARIOS)[number];

export class ScenarioDto {
  @ApiProperty({ example: "slow" })
  name!: string;

  @ApiProperty({
    example: "Delays the response to exercise loading and cancellation states.",
  })
  description!: string;
}

export class ScenariosResponseDto {
  @ApiProperty({ type: [ScenarioDto] })
  data!: ScenarioDto[];
}

export class TestingActionDataDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: "State reset to the default deterministic seed." })
  message!: string;
}

export class TestingActionResponseDto {
  @ApiProperty({ type: TestingActionDataDto })
  data!: TestingActionDataDto;
}
