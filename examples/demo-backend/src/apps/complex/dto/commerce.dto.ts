import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CursorMetaDto, PageMetaDto } from "../../../common/api.dto";
import { MoneyDto } from "./catalog.dto";

export class AddressDto {
  @ApiProperty({ example: "Friedrichstrasse 100" })
  line1!: string;

  @ApiProperty({ nullable: true, example: null })
  line2!: string | null;

  @ApiProperty({ example: "Berlin" })
  city!: string;

  @ApiProperty({ example: "10117" })
  postalCode!: string;

  @ApiProperty({ example: "DE" })
  countryCode!: string;
}

export class CustomerDto {
  @ApiProperty({ example: "customer-ada" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "Ada Lovelace" })
  name!: string;

  @ApiProperty({ format: "email", example: "ada@example.test" })
  email!: string;

  @ApiProperty({ type: AddressDto })
  defaultAddress!: AddressDto;

  @ApiProperty({ type: [String], example: ["vip", "newsletter"] })
  tags!: string[];

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class CustomerQueryDto {
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

  @ApiPropertyOptional({ example: "ada" })
  @IsString()
  @IsOptional()
  search?: string;
}

export class CustomersResponseDto {
  @ApiProperty({ type: [CustomerDto] })
  data!: CustomerDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}

export class CustomerResponseDto {
  @ApiProperty({ type: CustomerDto })
  data!: CustomerDto;
}

export enum ComplexOrderStatus {
  Draft = "draft",
  AwaitingPayment = "awaiting-payment",
  Paid = "paid",
  Fulfillment = "fulfillment",
  Shipped = "shipped",
  Cancelled = "cancelled",
}

export class ComplexOrderItemDto {
  @ApiProperty({ example: "complex-product-keyboard" })
  productId!: string;

  @ApiProperty({ example: "variant-keyboard-black" })
  variantId!: string;

  @ApiProperty({ example: "Pro Mechanical Keyboard" })
  name!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ type: MoneyDto })
  unitPrice!: MoneyDto;
}

export class ComplexOrderDto {
  @ApiProperty({ example: "complex-order-001" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "customer-ada" })
  customerId!: string;

  @ApiProperty({ enum: ComplexOrderStatus })
  status!: ComplexOrderStatus;

  @ApiProperty({ type: [ComplexOrderItemDto] })
  items!: ComplexOrderItemDto[];

  @ApiProperty({ type: MoneyDto })
  subtotal!: MoneyDto;

  @ApiProperty({ type: MoneyDto })
  discount!: MoneyDto;

  @ApiProperty({ type: MoneyDto })
  total!: MoneyDto;

  @ApiProperty({ type: AddressDto })
  shippingAddress!: AddressDto;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ example: 1 })
  version!: number;
}

export class OrderCursorQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ example: "complex-order-001" })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ enum: ComplexOrderStatus })
  @IsString()
  @IsOptional()
  status?: ComplexOrderStatus;
}

export class ComplexOrdersResponseDto {
  @ApiProperty({ type: [ComplexOrderDto] })
  data!: ComplexOrderDto[];

  @ApiProperty({ type: CursorMetaDto })
  meta!: CursorMetaDto;
}

export class ComplexOrderResponseDto {
  @ApiProperty({ type: ComplexOrderDto })
  data!: ComplexOrderDto;
}

export class CreateComplexOrderItemDto {
  @ApiProperty({ example: "complex-product-keyboard" })
  @IsString()
  productId!: string;

  @ApiProperty({ example: "variant-keyboard-black" })
  @IsString()
  variantId!: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  quantity!: number;
}

export class CreateComplexOrderDto {
  @ApiProperty({ example: "customer-ada" })
  @IsString()
  customerId!: string;

  @ApiProperty({ type: [CreateComplexOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComplexOrderItemDto)
  items!: CreateComplexOrderItemDto[];

  @ApiPropertyOptional({ example: "WELCOME10" })
  @IsString()
  @IsOptional()
  promotionCode?: string;
}

export class PaymentDto {
  @ApiProperty({ example: "payment-001" })
  id!: string;

  @ApiProperty({ example: "complex-order-001" })
  orderId!: string;

  @ApiProperty({
    enum: ["pending", "succeeded", "failed", "refunded"],
    example: "succeeded",
  })
  status!: "pending" | "succeeded" | "failed" | "refunded";

  @ApiProperty({ enum: ["card", "bank-transfer"], example: "card" })
  method!: "card" | "bank-transfer";

  @ApiProperty({ type: MoneyDto })
  amount!: MoneyDto;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class PaymentsResponseDto {
  @ApiProperty({ type: [PaymentDto] })
  data!: PaymentDto[];
}

export class PromotionDto {
  @ApiProperty({ example: "promotion-welcome" })
  id!: string;

  @ApiProperty({ example: "WELCOME10" })
  code!: string;

  @ApiProperty({ enum: ["percentage", "fixed"], example: "percentage" })
  type!: "percentage" | "fixed";

  @ApiProperty({ example: "10.00" })
  value!: string;

  @ApiProperty({ format: "date-time" })
  validUntil!: string;

  @ApiProperty({ example: true })
  active!: boolean;
}

export class PromotionsResponseDto {
  @ApiProperty({ type: [PromotionDto] })
  data!: PromotionDto[];
}

export class ReviewDto {
  @ApiProperty({ example: "review-001" })
  id!: string;

  @ApiProperty({ example: "complex-product-keyboard" })
  productId!: string;

  @ApiProperty({ example: "customer-ada" })
  customerId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating!: number;

  @ApiProperty({ example: "Excellent keyboard for daily development." })
  comment!: string;

  @ApiProperty({
    enum: ["pending", "published", "rejected"],
    example: "published",
  })
  status!: "pending" | "published" | "rejected";

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class ReviewsResponseDto {
  @ApiProperty({ type: [ReviewDto] })
  data!: ReviewDto[];
}

export class CreateReviewDto {
  @ApiProperty({ example: "complex-product-keyboard" })
  @IsString()
  productId!: string;

  @ApiProperty({ example: "customer-ada" })
  @IsString()
  customerId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({ example: "Excellent keyboard for daily development." })
  @IsString()
  comment!: string;
}

export class ReviewResponseDto {
  @ApiProperty({ type: ReviewDto })
  data!: ReviewDto;
}
