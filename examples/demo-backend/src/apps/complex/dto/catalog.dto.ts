import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { CursorMetaDto } from "../../../common/api.dto";

export class MoneyDto {
  @ApiProperty({
    example: "129.90",
    pattern: "^\\d+\\.\\d{2}$",
    description:
      "Decimal string; never parse money as a floating-point number.",
  })
  amount!: string;

  @ApiProperty({ enum: ["USD", "EUR"], example: "USD" })
  currency!: "USD" | "EUR";
}

export enum ComplexProductStatus {
  Draft = "draft",
  Active = "active",
  Archived = "archived",
}

export class ProductVariantDto {
  @ApiProperty({ example: "variant-keyboard-black" })
  id!: string;

  @ApiProperty({ example: "KEYBOARD-BLACK-US" })
  sku!: string;

  @ApiProperty({
    type: "object",
    additionalProperties: { type: "string" },
    example: { color: "black", layout: "US" },
  })
  attributes!: Record<string, string>;

  @ApiProperty({ type: MoneyDto })
  price!: MoneyDto;
}

export class ComplexProductDto {
  @ApiProperty({ example: "complex-product-keyboard" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "Pro Mechanical Keyboard" })
  name!: string;

  @ApiProperty({ example: "pro-mechanical-keyboard" })
  slug!: string;

  @ApiProperty({ example: "Configurable keyboard sold in multiple variants." })
  description!: string;

  @ApiProperty({ enum: ComplexProductStatus })
  status!: ComplexProductStatus;

  @ApiProperty({ example: "complex-category-electronics" })
  categoryId!: string;

  @ApiProperty({ example: "brand-northstar" })
  brandId!: string;

  @ApiProperty({ type: MoneyDto })
  price!: MoneyDto;

  @ApiProperty({ type: [ProductVariantDto] })
  variants!: ProductVariantDto[];

  @ApiProperty({ type: [String], example: ["featured", "office"] })
  tags!: string[];

  @ApiProperty({ format: "date-time", nullable: true })
  publishedAt!: string | null;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ example: 3, description: "Optimistic-lock version." })
  version!: number;
}

export class CursorProductQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ example: "complex-product-mouse" })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ example: "keyboard" })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ComplexProductStatus })
  @IsEnum(ComplexProductStatus)
  @IsOptional()
  status?: ComplexProductStatus;
}

export class ComplexProductsResponseDto {
  @ApiProperty({ type: [ComplexProductDto] })
  data!: ComplexProductDto[];

  @ApiProperty({ type: CursorMetaDto })
  meta!: CursorMetaDto;
}

export class ComplexProductResponseDto {
  @ApiProperty({ type: ComplexProductDto })
  data!: ComplexProductDto;
}

export class CreateVariantDto {
  @ApiProperty({ example: "KEYBOARD-WHITE-US" })
  @IsString()
  sku!: string;

  @ApiProperty({
    type: "object",
    additionalProperties: { type: "string" },
    example: { color: "white", layout: "US" },
  })
  @IsObject()
  attributes!: Record<string, string>;

  @ApiProperty({ example: "139.90" })
  @IsString()
  priceAmount!: string;
}

export class CreateComplexProductDto {
  @ApiProperty({ example: "Pro Mechanical Keyboard" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "Configurable keyboard sold in multiple variants." })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({
    enum: ComplexProductStatus,
    default: ComplexProductStatus.Draft,
  })
  @IsEnum(ComplexProductStatus)
  status!: ComplexProductStatus;

  @ApiProperty({ example: "complex-category-electronics" })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: "brand-northstar" })
  @IsString()
  brandId!: string;

  @ApiProperty({ example: "129.90" })
  @IsString()
  priceAmount!: string;

  @ApiProperty({ type: [CreateVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];

  @ApiPropertyOptional({ type: [String], example: ["featured"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[] = [];
}

export class UpdateComplexProductDto extends PartialType(
  CreateComplexProductDto,
) {
  @ApiProperty({
    minimum: 1,
    example: 3,
    description: "Version last read by the frontend.",
  })
  @IsInt()
  @Min(1)
  version!: number;
}

export class ComplexCategoryDto {
  @ApiProperty({ example: "complex-category-electronics" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "Electronics" })
  name!: string;

  @ApiProperty({ nullable: true, example: null })
  parentId!: string | null;

  @ApiProperty({ type: [String], example: ["complex-category-keyboards"] })
  childIds!: string[];
}

export class ComplexCategoriesResponseDto {
  @ApiProperty({ type: [ComplexCategoryDto] })
  data!: ComplexCategoryDto[];
}

export class BrandDto {
  @ApiProperty({ example: "brand-northstar" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "Northstar" })
  name!: string;

  @ApiProperty({ format: "uri", nullable: true })
  logoUrl!: string | null;
}

export class BrandsResponseDto {
  @ApiProperty({ type: [BrandDto] })
  data!: BrandDto[];
}

export class WarehouseDto {
  @ApiProperty({ example: "warehouse-berlin" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "Berlin Warehouse" })
  name!: string;

  @ApiProperty({ example: "DE" })
  countryCode!: string;

  @ApiProperty({ enum: ["active", "maintenance"], example: "active" })
  status!: "active" | "maintenance";
}

export class WarehousesResponseDto {
  @ApiProperty({ type: [WarehouseDto] })
  data!: WarehouseDto[];
}

export class InventoryItemDto {
  @ApiProperty({ example: "inventory-keyboard-berlin" })
  id!: string;

  @ApiProperty({ example: "complex-product-keyboard" })
  productId!: string;

  @ApiProperty({ example: "variant-keyboard-black" })
  variantId!: string;

  @ApiProperty({ example: "warehouse-berlin" })
  warehouseId!: string;

  @ApiProperty({ example: 42 })
  available!: number;

  @ApiProperty({ example: 5 })
  reserved!: number;

  @ApiProperty({ example: 10 })
  reorderPoint!: number;

  @ApiProperty({ example: 2 })
  version!: number;
}

export class InventoryResponseDto {
  @ApiProperty({ type: [InventoryItemDto] })
  data!: InventoryItemDto[];
}

export class InventoryItemResponseDto {
  @ApiProperty({ type: InventoryItemDto })
  data!: InventoryItemDto;
}

export class AdjustInventoryDto {
  @ApiProperty({ example: -2, description: "Signed stock adjustment." })
  @IsInt()
  delta!: number;

  @ApiProperty({ example: "Damaged during delivery" })
  @IsString()
  @MinLength(3)
  reason!: string;

  @ApiProperty({
    example: 2,
    description: "Version last read by the frontend.",
  })
  @IsInt()
  @Min(1)
  version!: number;
}
