import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { PageMetaDto } from "../../common/api.dto";

export enum SimpleRole {
  Admin = "admin",
  Customer = "customer",
}

export class SimpleUserDto {
  @ApiProperty({ example: "user-admin" })
  id!: string;

  @ApiProperty({ format: "email", example: "admin@demo.local" })
  email!: string;

  @ApiProperty({ example: "Demo Admin" })
  name!: string;

  @ApiProperty({ enum: SimpleRole })
  role!: SimpleRole;

  @ApiProperty({ nullable: true, example: "https://i.pravatar.cc/160?img=12" })
  avatarUrl!: string | null;
}

export class SimpleUserResponseDto {
  @ApiProperty({ type: SimpleUserDto })
  data!: SimpleUserDto;
}

export class LoginDto {
  @ApiProperty({ format: "email", example: "admin@demo.local" })
  @IsEmail()
  email!: string;

  @ApiProperty({ format: "password", example: "demo1234", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description:
      "Refresh token returned by login or the previous refresh call.",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class JwtTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({
    example: 60,
    description: "Access-token lifetime in seconds.",
  })
  expiresIn!: number;

  @ApiProperty({ enum: ["Bearer"], example: "Bearer" })
  tokenType!: "Bearer";
}

export class JwtAuthDataDto {
  @ApiProperty({ type: JwtTokensDto })
  tokens!: JwtTokensDto;

  @ApiProperty({ type: SimpleUserDto })
  user!: SimpleUserDto;
}

export class JwtAuthResponseDto {
  @ApiProperty({ type: JwtAuthDataDto })
  data!: JwtAuthDataDto;
}

export enum ProductSort {
  Newest = "newest",
  PriceAsc = "price-asc",
  PriceDesc = "price-desc",
  Name = "name",
}

export class ProductQueryDto {
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

  @ApiPropertyOptional({ example: "keyboard" })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: "category-electronics" })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProductSort, default: ProductSort.Newest })
  @IsEnum(ProductSort)
  @IsOptional()
  sort = ProductSort.Newest;
}

export class PageQueryDto {
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
}

export class SimpleProductDto {
  @ApiProperty({ example: "product-keyboard" })
  id!: string;

  @ApiProperty({ example: "Mechanical Keyboard" })
  name!: string;

  @ApiProperty({ example: "mechanical-keyboard" })
  slug!: string;

  @ApiProperty({ example: "Hot-swappable compact keyboard." })
  description!: string;

  @ApiProperty({
    example: 12990,
    description: "Price in the smallest currency unit.",
  })
  priceCents!: number;

  @ApiProperty({ enum: ["USD", "EUR"], example: "USD" })
  currency!: "USD" | "EUR";

  @ApiProperty({ example: "category-electronics" })
  categoryId!: string;

  @ApiProperty({ example: 24, minimum: 0 })
  stock!: number;

  @ApiProperty({ example: 4.8, minimum: 0, maximum: 5 })
  rating!: number;

  @ApiProperty({
    format: "uri",
    example: "https://picsum.photos/seed/keyboard/640/480",
  })
  imageUrl!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;

  @ApiProperty({ example: 1, description: "Optimistic-lock version." })
  version!: number;
}

export class ProductsResponseDto {
  @ApiProperty({ type: [SimpleProductDto] })
  data!: SimpleProductDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}

export class ProductResponseDto {
  @ApiProperty({ type: SimpleProductDto })
  data!: SimpleProductDto;
}

export class CreateProductDto {
  @ApiProperty({ example: "USB-C Dock" })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "Dock with HDMI, Ethernet and power delivery." })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ example: 8990, minimum: 0 })
  @IsInt()
  @Min(0)
  priceCents!: number;

  @ApiProperty({ enum: ["USD", "EUR"], example: "USD" })
  @IsEnum(["USD", "EUR"])
  currency!: "USD" | "EUR";

  @ApiProperty({ example: "category-electronics" })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 15, minimum: 0 })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiProperty({
    format: "uri",
    example: "https://picsum.photos/seed/dock/640/480",
  })
  @IsString()
  imageUrl!: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    example: 1,
    minimum: 1,
    description: "Version last read by the frontend.",
  })
  @IsInt()
  @Min(1)
  version!: number;
}

export class SimpleCategoryDto {
  @ApiProperty({ example: "category-electronics" })
  id!: string;

  @ApiProperty({ example: "Electronics" })
  name!: string;

  @ApiProperty({ example: "electronics" })
  slug!: string;

  @ApiProperty({ example: 4 })
  productCount!: number;
}

export class CategoriesResponseDto {
  @ApiProperty({ type: [SimpleCategoryDto] })
  data!: SimpleCategoryDto[];
}

export class CategoryResponseDto {
  @ApiProperty({ type: SimpleCategoryDto })
  data!: SimpleCategoryDto;
}

export enum OrderStatus {
  Pending = "pending",
  Paid = "paid",
  Shipped = "shipped",
  Cancelled = "cancelled",
}

export class CreateOrderItemDto {
  @ApiProperty({ example: "product-keyboard" })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export class SimpleOrderItemDto {
  @ApiProperty({ example: "product-keyboard" })
  productId!: string;

  @ApiProperty({ example: "Mechanical Keyboard" })
  productName!: string;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 12990 })
  unitPriceCents!: number;
}

export class SimpleOrderDto {
  @ApiProperty({ example: "order-001" })
  id!: string;

  @ApiProperty({ example: "user-customer" })
  userId!: string;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ type: [SimpleOrderItemDto] })
  items!: SimpleOrderItemDto[];

  @ApiProperty({ example: 17980 })
  totalCents!: number;

  @ApiProperty({ enum: ["USD", "EUR"], example: "USD" })
  currency!: "USD" | "EUR";

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class OrdersResponseDto {
  @ApiProperty({ type: [SimpleOrderDto] })
  data!: SimpleOrderDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}

export class OrderResponseDto {
  @ApiProperty({ type: SimpleOrderDto })
  data!: SimpleOrderDto;
}

export class ChangeSimpleRoleDto {
  @ApiProperty({ enum: SimpleRole, example: SimpleRole.Customer })
  @IsEnum(SimpleRole)
  role!: SimpleRole;
}
