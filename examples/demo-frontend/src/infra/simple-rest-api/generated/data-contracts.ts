/* eslint-disable */
/* tslint:disable */
// @ts-nocheck

/*
 * ----------------------------------------------------------------------
 * ## АВТОМАТИЧЕСКИ СГЕНЕРИРОВАННЫЙ ФАЙЛ                               ##
 * ##                                                                  ##
 * ## Не редактируйте вручную: изменения будут перезаписаны.           ##
 * ## Для изменений перегенерируйте клиент.                            ##
 * ##                                                                  ##
 * ## Генератор: @gromlab/api-codegen                                  ##
 * ## Репозиторий: https://gromlab.ru/gromov/api-codegen               ##
 * ----------------------------------------------------------------------
 */

export interface HealthDataDto {
  /** @example "simple" */
  application: HealthDataDtoApplicationEnum;
  /** @example "ok" */
  status: HealthDataDtoStatusEnum;
  /** @format date-time */
  timestamp: string;
  /** @example "1.0.0" */
  version: string;
}

export interface HealthResponseDto {
  data: HealthDataDto;
}

export interface LoginDto {
  /**
   * @format email
   * @example "admin@demo.local"
   */
  email: string;
  /**
   * @format password
   * @minLength 8
   * @example "demo1234"
   */
  password: string;
}

export interface JwtTokensDto {
  accessToken: string;
  refreshToken: string;
  /**
   * Access-token lifetime in seconds.
   * @example 60
   */
  expiresIn: number;
  /** @example "Bearer" */
  tokenType: JwtTokensDtoTokenTypeEnum;
}

export interface SimpleUserDto {
  /** @example "user-admin" */
  id: string;
  /**
   * @format email
   * @example "admin@demo.local"
   */
  email: string;
  /** @example "Demo Admin" */
  name: string;
  role: SimpleUserDtoRoleEnum;
  /** @example "https://i.pravatar.cc/160?img=12" */
  avatarUrl: object | null;
}

export interface JwtAuthDataDto {
  tokens: JwtTokensDto;
  user: SimpleUserDto;
}

export interface JwtAuthResponseDto {
  data: JwtAuthDataDto;
}

export interface ErrorDetailDto {
  /** @example "email" */
  field?: string;
  /** @example "must be an email" */
  message: string;
  /** @example "isEmail" */
  code?: string;
}

export interface ErrorResponseDto {
  /** @example 404 */
  statusCode: number;
  /** @example "PRODUCT_NOT_FOUND" */
  code: string;
  /** @example "Product not found" */
  message: string;
  details: ErrorDetailDto[];
  /**
   * @format date-time
   * @example "2026-07-30T12:00:00.000Z"
   */
  timestamp: string;
  /** @example "/api/v1/products/product-404" */
  path: string;
  /** @example "req-5c9f7a3d" */
  requestId: string;
}

export interface RefreshTokenDto {
  /** Refresh token returned by login or the previous refresh call. */
  refreshToken: string;
}

export interface SimpleUserResponseDto {
  data: SimpleUserDto;
}

export type Object = object;

export interface SimpleProductDto {
  /** @example "product-keyboard" */
  id: string;
  /** @example "Mechanical Keyboard" */
  name: string;
  /** @example "mechanical-keyboard" */
  slug: string;
  /** @example "Hot-swappable compact keyboard." */
  description: string;
  /**
   * Price in the smallest currency unit.
   * @example 12990
   */
  priceCents: number;
  /** @example "USD" */
  currency: SimpleProductDtoCurrencyEnum;
  /** @example "category-electronics" */
  categoryId: string;
  /**
   * @min 0
   * @example 24
   */
  stock: number;
  /**
   * @min 0
   * @max 5
   * @example 4.8
   */
  rating: number;
  /**
   * @format uri
   * @example "https://picsum.photos/seed/keyboard/640/480"
   */
  imageUrl: string;
  /** @format date-time */
  createdAt: string;
  /**
   * Optimistic-lock version.
   * @example 1
   */
  version: number;
}

export interface PageMetaDto {
  /**
   * @min 1
   * @example 1
   */
  page: number;
  /**
   * @min 1
   * @example 20
   */
  limit: number;
  /**
   * @min 0
   * @example 48
   */
  total: number;
  /**
   * @min 0
   * @example 3
   */
  totalPages: number;
}

export interface ProductsResponseDto {
  data: SimpleProductDto[];
  meta: PageMetaDto;
}

export interface ProductResponseDto {
  data: SimpleProductDto;
}

export interface CreateProductDto {
  /** @example "USB-C Dock" */
  name: string;
  /** @example "Dock with HDMI, Ethernet and power delivery." */
  description: string;
  /**
   * @min 0
   * @example 8990
   */
  priceCents: number;
  /** @example "USD" */
  currency: CreateProductDtoCurrencyEnum;
  /** @example "category-electronics" */
  categoryId: string;
  /**
   * @min 0
   * @example 15
   */
  stock: number;
  /**
   * @format uri
   * @example "https://picsum.photos/seed/dock/640/480"
   */
  imageUrl: string;
}

export interface UpdateProductDto {
  /** @example "USB-C Dock" */
  name?: string;
  /** @example "Dock with HDMI, Ethernet and power delivery." */
  description?: string;
  /**
   * @min 0
   * @example 8990
   */
  priceCents?: number;
  /** @example "USD" */
  currency?: UpdateProductDtoCurrencyEnum;
  /** @example "category-electronics" */
  categoryId?: string;
  /**
   * @min 0
   * @example 15
   */
  stock?: number;
  /**
   * @format uri
   * @example "https://picsum.photos/seed/dock/640/480"
   */
  imageUrl?: string;
  /**
   * Version last read by the frontend.
   * @min 1
   * @example 1
   */
  version: number;
}

export interface MutationResultDto {
  /** @example "product-001" */
  id: string;
  /** @example true */
  success: boolean;
}

export interface MutationResponseDto {
  data: MutationResultDto;
}

export interface SimpleCategoryDto {
  /** @example "category-electronics" */
  id: string;
  /** @example "Electronics" */
  name: string;
  /** @example "electronics" */
  slug: string;
  /** @example 4 */
  productCount: number;
}

export interface CategoriesResponseDto {
  data: SimpleCategoryDto[];
}

export interface CategoryResponseDto {
  data: SimpleCategoryDto;
}

export interface SimpleOrderItemDto {
  /** @example "product-keyboard" */
  productId: string;
  /** @example "Mechanical Keyboard" */
  productName: string;
  /** @example 1 */
  quantity: number;
  /** @example 12990 */
  unitPriceCents: number;
}

export interface SimpleOrderDto {
  /** @example "order-001" */
  id: string;
  /** @example "user-customer" */
  userId: string;
  status: SimpleOrderDtoStatusEnum;
  items: SimpleOrderItemDto[];
  /** @example 17980 */
  totalCents: number;
  /** @example "USD" */
  currency: SimpleOrderDtoCurrencyEnum;
  /** @format date-time */
  createdAt: string;
}

export interface OrdersResponseDto {
  data: SimpleOrderDto[];
  meta: PageMetaDto;
}

export interface OrderResponseDto {
  data: SimpleOrderDto;
}

export interface CreateOrderItemDto {
  /** @example "product-keyboard" */
  productId: string;
  /**
   * @min 1
   * @max 20
   * @example 1
   */
  quantity: number;
  /**
   * @min 1
   * @example 1
   */
  expectedVersion: number;
  /**
   * @min 0
   * @example 12990
   */
  expectedUnitPriceCents: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
}

export interface ScenarioDto {
  /** @example "slow" */
  name: string;
  /** @example "Delays the response to exercise loading and cancellation states." */
  description: string;
}

export interface ScenariosResponseDto {
  data: ScenarioDto[];
}

export interface TestingActionDataDto {
  /** @example true */
  success: boolean;
  /** @example "State reset to the default deterministic seed." */
  message: string;
}

export interface TestingActionResponseDto {
  data: TestingActionDataDto;
}

export interface ChangeSimpleRoleDto {
  /** @example "customer" */
  role: ChangeSimpleRoleDtoRoleEnum;
}

/** @example "simple" */
export type HealthDataDtoApplicationEnum = "simple" | "complex";

/** @example "ok" */
export type HealthDataDtoStatusEnum = "ok";

/** @example "Bearer" */
export type JwtTokensDtoTokenTypeEnum = "Bearer";

export type SimpleUserDtoRoleEnum = "admin" | "customer";

/** @example "USD" */
export type SimpleProductDtoCurrencyEnum = "USD" | "EUR";

/** @example "USD" */
export type CreateProductDtoCurrencyEnum = "USD" | "EUR";

/** @example "USD" */
export type UpdateProductDtoCurrencyEnum = "USD" | "EUR";

export type SimpleOrderDtoStatusEnum =
  | "pending"
  | "paid"
  | "shipped"
  | "cancelled";

/** @example "USD" */
export type SimpleOrderDtoCurrencyEnum = "USD" | "EUR";

/** @example "customer" */
export type ChangeSimpleRoleDtoRoleEnum = "admin" | "customer";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleHealthHealthParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleAuthLoginParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleAuthRefreshParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleAuthLogoutParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleUsersMeParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleProductsListParams {
  /**
   * @min 1
   * @default 1
   */
  page?: Object;
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  limit?: Object;
  /** @example "keyboard" */
  search?: string;
  /** @example "category-electronics" */
  categoryId?: string;
  /** @default "newest" */
  sort?: SortEnum;
}

/** @default "newest" */
export type SortEnum = "newest" | "price-asc" | "price-desc" | "name";

/** @default "newest" */
export type SimpleProductsListParams1SortEnum =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "name";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleProductsListParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleProductsCreateParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleProductsGetParams {
  id: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleProductsGetParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleProductsUpdateParams {
  id: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleProductsUpdateParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleProductsRemoveParams {
  id: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleProductsRemoveParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleCategoriesListParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleCategoriesGetParams {
  id: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleCategoriesGetParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleOrdersListParams {
  /**
   * @min 1
   * @default 1
   */
  page?: Object;
  /**
   * @min 1
   * @max 100
   * @default 20
   */
  limit?: Object;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleOrdersListParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleOrdersCreateParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleOrdersGetParams {
  id: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleOrdersGetParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleOrdersCancelParams {
  id: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleOrdersCancelParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleTestingScenariosParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleTestingResetParamsXDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export interface SimpleTestingSeedParams {
  preset: PresetEnum;
}

export type PresetEnum = "small" | "large";

export type SimpleTestingSeedParams1PresetEnum = "small" | "large";

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleTestingSeedParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";

export type SimpleTestingSeedParams1Enum = "small" | "large";

export interface SimpleTestingChangeRoleParams {
  userId: string;
}

/** Forces a deterministic frontend-testing scenario for this request. */
export type SimpleTestingChangeRoleParams1XDemoScenarioEnum =
  | "normal"
  | "slow"
  | "timeout"
  | "server-error"
  | "rate-limited"
  | "empty"
  | "expired-auth"
  | "forbidden"
  | "conflict"
  | "large-dataset";
