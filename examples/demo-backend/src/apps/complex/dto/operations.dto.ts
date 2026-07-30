import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from "@nestjs/swagger";
import { CursorMetaDto, PageMetaDto } from "../../../common/api.dto";

export class OrderNotificationPayloadDto {
  @ApiProperty({ enum: ["order"], example: "order" })
  type!: "order";

  @ApiProperty({ example: "complex-order-001" })
  orderId!: string;

  @ApiProperty({ enum: ["paid", "shipped", "cancelled"], example: "shipped" })
  status!: string;
}

export class InventoryNotificationPayloadDto {
  @ApiProperty({ enum: ["inventory"], example: "inventory" })
  type!: "inventory";

  @ApiProperty({ example: "complex-product-keyboard" })
  productId!: string;

  @ApiProperty({ example: 4 })
  remaining!: number;
}

export class SystemNotificationPayloadDto {
  @ApiProperty({ enum: ["system"], example: "system" })
  type!: "system";

  @ApiProperty({ example: "Scheduled maintenance begins at 02:00 UTC." })
  text!: string;
}

export enum NotificationKind {
  Order = "order",
  Inventory = "inventory",
  System = "system",
}

@ApiExtraModels(
  OrderNotificationPayloadDto,
  InventoryNotificationPayloadDto,
  SystemNotificationPayloadDto,
)
export class NotificationDto {
  @ApiProperty({ example: "notification-001" })
  id!: string;

  @ApiProperty({ enum: NotificationKind })
  kind!: NotificationKind;

  @ApiProperty({ example: "Order shipped" })
  title!: string;

  @ApiProperty({
    oneOf: [
      { $ref: getSchemaPath(OrderNotificationPayloadDto) },
      { $ref: getSchemaPath(InventoryNotificationPayloadDto) },
      { $ref: getSchemaPath(SystemNotificationPayloadDto) },
    ],
    discriminator: {
      propertyName: "type",
      mapping: {
        order: getSchemaPath(OrderNotificationPayloadDto),
        inventory: getSchemaPath(InventoryNotificationPayloadDto),
        system: getSchemaPath(SystemNotificationPayloadDto),
      },
    },
  })
  payload!:
    | OrderNotificationPayloadDto
    | InventoryNotificationPayloadDto
    | SystemNotificationPayloadDto;

  @ApiProperty({ example: false })
  read!: boolean;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class NotificationsResponseDto {
  @ApiProperty({ type: [NotificationDto] })
  data!: NotificationDto[];

  @ApiProperty({ type: CursorMetaDto })
  meta!: CursorMetaDto;
}

export class NotificationResponseDto {
  @ApiProperty({ type: NotificationDto })
  data!: NotificationDto;
}

export class CursorQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ example: "notification-020" })
  @IsString()
  @IsOptional()
  cursor?: string;
}

export class FileMetadataDto {
  @ApiProperty({ example: "file-001" })
  id!: string;

  @ApiProperty({ example: "products.csv" })
  name!: string;

  @ApiProperty({ example: "text/csv" })
  mimeType!: string;

  @ApiProperty({ example: 18432 })
  size!: number;

  @ApiProperty({ format: "uri", example: "/api/v1/files/file-001/download" })
  downloadUrl!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class FileResponseDto {
  @ApiProperty({ type: FileMetadataDto })
  data!: FileMetadataDto;
}

export class FilesResponseDto {
  @ApiProperty({ type: [FileMetadataDto] })
  data!: FileMetadataDto[];
}

export class AuditEventDto {
  @ApiProperty({ example: "audit-001" })
  id!: string;

  @ApiProperty({ example: "product.updated" })
  action!: string;

  @ApiProperty({ example: "complex-user-admin" })
  actorId!: string;

  @ApiProperty({ example: "product" })
  resourceType!: string;

  @ApiProperty({ example: "complex-product-keyboard" })
  resourceId!: string;

  @ApiProperty({
    type: "object",
    additionalProperties: true,
    example: { version: 4 },
  })
  metadata!: Record<string, unknown>;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class AuditQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ example: "product.updated" })
  @IsString()
  @IsOptional()
  action?: string;
}

export class AuditEventsResponseDto {
  @ApiProperty({ type: [AuditEventDto] })
  data!: AuditEventDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}

export enum JobStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed",
}

export class JobDto {
  @ApiProperty({ example: "job-001" })
  id!: string;

  @ApiProperty({ enum: ["orders-export"], example: "orders-export" })
  type!: "orders-export";

  @ApiProperty({ enum: JobStatus })
  status!: JobStatus;

  @ApiProperty({ example: 75, minimum: 0, maximum: 100 })
  progress!: number;

  @ApiProperty({
    format: "uri",
    nullable: true,
    example: "/api/v1/jobs/job-001/result",
  })
  resultUrl!: string | null;

  @ApiProperty({ nullable: true, example: null })
  error!: string | null;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class JobResponseDto {
  @ApiProperty({ type: JobDto })
  data!: JobDto;
}
