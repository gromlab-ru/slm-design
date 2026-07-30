import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotModifiedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import {
  ApiDemoScenarioHeader,
  ApiOrganizationHeader,
  ApiStandardErrors,
} from "../../../common/api.decorators";
import {
  ComplexCookieGuard,
  ComplexCsrfGuard,
  type ComplexDemoRequest,
  ComplexOrganizationGuard,
  ComplexRoles,
  ComplexRolesGuard,
} from "../complex.auth";
import { ComplexStore } from "../complex.store";
import {
  AdjustInventoryDto,
  BrandsResponseDto,
  ComplexCategoriesResponseDto,
  ComplexProductResponseDto,
  ComplexProductsResponseDto,
  CreateComplexProductDto,
  CursorProductQueryDto,
  InventoryItemResponseDto,
  InventoryResponseDto,
  UpdateComplexProductDto,
  WarehousesResponseDto,
} from "../dto/catalog.dto";
import { ComplexRole } from "../dto/identity.dto";

@ApiTags("Products")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("products")
export class ComplexProductsController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({ summary: "List tenant products using cursor pagination" })
  @ApiOkResponse({ type: ComplexProductsResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: ComplexDemoRequest,
    @Query() query: CursorProductQueryDto,
  ): ComplexProductsResponseDto {
    return this.store.listProducts(request.organizationId!, query);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a rich product with variants and ETag support",
  })
  @ApiOkResponse({ type: ComplexProductResponseDto })
  @ApiNotModifiedResponse()
  @ApiStandardErrors({ auth: true, notFound: true })
  get(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): ComplexProductResponseDto | undefined {
    const product = this.store.getProduct(request.organizationId!, id);
    const etag = `W/\"${product.id}-v${product.version}\"`;
    response.setHeader("ETag", etag);
    response.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
    if (etag === ifNoneMatch) {
      response.status(304);
      return undefined;
    }
    return { data: product };
  }

  @Post()
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Create a tenant product with variants" })
  @ApiCreatedResponse({ type: ComplexProductResponseDto })
  @ApiStandardErrors({ auth: true })
  create(
    @Req() request: ComplexDemoRequest,
    @Body() dto: CreateComplexProductDto,
  ): ComplexProductResponseDto {
    return {
      data: this.store.createProduct(
        request.organizationId!,
        request.user!.id,
        dto,
      ),
    };
  }

  @Patch(":id")
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Update a product using optimistic locking" })
  @ApiOkResponse({ type: ComplexProductResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true, conflict: true })
  update(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Body() dto: UpdateComplexProductDto,
  ): ComplexProductResponseDto {
    return {
      data: this.store.updateProduct(
        request.organizationId!,
        request.user!.id,
        id,
        dto,
      ),
    };
  }
}

@ApiTags("Catalog")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller()
export class ComplexCatalogController {
  constructor(private readonly store: ComplexStore) {}

  @Get("categories")
  @ApiOperation({ summary: "List a recursive category tree" })
  @ApiOkResponse({ type: ComplexCategoriesResponseDto })
  @ApiStandardErrors({ auth: true })
  categories(@Req() request: ComplexDemoRequest): ComplexCategoriesResponseDto {
    return { data: this.store.listCategories(request.organizationId!) };
  }

  @Get("brands")
  @ApiOperation({ summary: "List product brands" })
  @ApiOkResponse({ type: BrandsResponseDto })
  @ApiStandardErrors({ auth: true })
  brands(@Req() request: ComplexDemoRequest): BrandsResponseDto {
    return { data: this.store.listBrands(request.organizationId!) };
  }
}

@ApiTags("Inventory")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller()
export class ComplexInventoryController {
  constructor(private readonly store: ComplexStore) {}

  @Get("warehouses")
  @ApiOperation({ summary: "List tenant warehouses" })
  @ApiOkResponse({ type: WarehousesResponseDto })
  @ApiStandardErrors({ auth: true })
  warehouses(@Req() request: ComplexDemoRequest): WarehousesResponseDto {
    return { data: this.store.listWarehouses(request.organizationId!) };
  }

  @Get("inventory")
  @ApiOperation({ summary: "List inventory with optional product filter" })
  @ApiOkResponse({ type: InventoryResponseDto })
  @ApiStandardErrors({ auth: true })
  inventory(
    @Req() request: ComplexDemoRequest,
    @Query("productId") productId?: string,
  ): InventoryResponseDto {
    return {
      data: this.store.listInventory(request.organizationId!, productId),
    };
  }

  @Post("inventory/:id/adjust")
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Adjust stock using optimistic locking" })
  @ApiOkResponse({ type: InventoryItemResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true, conflict: true })
  adjust(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Body() dto: AdjustInventoryDto,
  ): InventoryItemResponseDto {
    return {
      data: this.store.adjustInventory(
        request.organizationId!,
        request.user!.id,
        id,
        dto,
      ),
    };
  }
}
