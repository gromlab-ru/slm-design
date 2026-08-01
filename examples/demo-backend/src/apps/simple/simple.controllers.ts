import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotModifiedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import {
  ApiDemoScenarioHeader,
  ApiStandardErrors,
} from "../../common/api.decorators";
import {
  HealthResponseDto,
  MutationResponseDto,
  ScenariosResponseDto,
  TestingActionResponseDto,
} from "../../common/api.dto";
import type { DemoRequest } from "../../common/request.types";
import {
  SimpleAdminGuard,
  SimpleAuthService,
  SimpleJwtGuard,
} from "./simple.auth";
import {
  CategoriesResponseDto,
  CategoryResponseDto,
  ChangeSimpleRoleDto,
  CreateOrderDto,
  CreateProductDto,
  JwtAuthResponseDto,
  LoginDto,
  OrderResponseDto,
  OrdersResponseDto,
  PageQueryDto,
  ProductQueryDto,
  ProductResponseDto,
  ProductsResponseDto,
  RefreshTokenDto,
  SimpleRole,
  SimpleUserResponseDto,
  UpdateProductDto,
} from "./simple.dto";
import { SimpleStore } from "./simple.store";

@ApiTags("Health")
@ApiDemoScenarioHeader()
@Controller("health")
export class SimpleHealthController {
  @Get()
  @ApiOperation({ summary: "Check Simple API availability" })
  @ApiOkResponse({ type: HealthResponseDto })
  health(): HealthResponseDto {
    return {
      data: {
        application: "simple",
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }
}

@ApiTags("Auth")
@ApiDemoScenarioHeader()
@Controller("auth")
export class SimpleAuthController {
  constructor(private readonly auth: SimpleAuthService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login and receive JWT access/refresh tokens" })
  @ApiOkResponse({ type: JwtAuthResponseDto })
  @ApiStandardErrors()
  login(@Body() dto: LoginDto): Promise<JwtAuthResponseDto> {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({
    summary: "Rotate a refresh token and issue a new token pair",
  })
  @ApiOkResponse({ type: JwtAuthResponseDto })
  @ApiStandardErrors({ auth: true })
  refresh(@Body() dto: RefreshTokenDto): Promise<JwtAuthResponseDto> {
    return this.auth.refresh(dto);
  }

  @Post("logout")
  @HttpCode(204)
  @ApiOperation({
    summary: "Revoke a refresh token; the operation is idempotent",
  })
  @ApiNoContentResponse()
  @ApiStandardErrors()
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.auth.logout(dto);
  }
}

@ApiTags("Users")
@ApiBearerAuth("jwt")
@ApiDemoScenarioHeader()
@UseGuards(SimpleJwtGuard)
@Controller("users")
export class SimpleUsersController {
  constructor(private readonly store: SimpleStore) {}

  @Get("me")
  @ApiOperation({ summary: "Get the authenticated user" })
  @ApiOkResponse({ type: SimpleUserResponseDto })
  @ApiStandardErrors({ auth: true })
  me(@Req() request: DemoRequest): SimpleUserResponseDto {
    const user = this.store.findUserById(request.user!.id)!;
    return { data: this.store.publicUser(user) };
  }
}

@ApiTags("Products")
@ApiDemoScenarioHeader()
@Controller("products")
export class SimpleProductsController {
  constructor(private readonly store: SimpleStore) {}

  @Get()
  @ApiOperation({
    summary: "List products using offset pagination, filters and sorting",
  })
  @ApiOkResponse({ type: ProductsResponseDto })
  @ApiStandardErrors()
  list(@Query() query: ProductQueryDto): ProductsResponseDto {
    return this.store.listProducts(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one product with ETag support" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotModifiedResponse({
    description: "The supplied If-None-Match value is current.",
  })
  @ApiStandardErrors({ notFound: true })
  get(
    @Param("id") id: string,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): ProductResponseDto | undefined {
    const product = this.store.getProduct(id);
    const etag = `W/\"${product.id}-v${product.version}\"`;
    response.setHeader("ETag", etag);
    response.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
    if (ifNoneMatch === etag) {
      response.status(304);
      return undefined;
    }
    return { data: product };
  }

  @Post()
  @UseGuards(SimpleJwtGuard, SimpleAdminGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Create a product as an administrator" })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiStandardErrors({ auth: true })
  create(@Body() dto: CreateProductDto): ProductResponseDto {
    return { data: this.store.createProduct(dto) };
  }

  @Patch(":id")
  @UseGuards(SimpleJwtGuard, SimpleAdminGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Update a product using optimistic locking" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true, conflict: true })
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
  ): ProductResponseDto {
    return { data: this.store.updateProduct(id, dto) };
  }

  @Delete(":id")
  @UseGuards(SimpleJwtGuard, SimpleAdminGuard)
  @ApiBearerAuth("jwt")
  @ApiOperation({ summary: "Delete a product as an administrator" })
  @ApiOkResponse({ type: MutationResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  remove(@Param("id") id: string): MutationResponseDto {
    this.store.deleteProduct(id);
    return { data: { id, success: true } };
  }
}

@ApiTags("Categories")
@ApiDemoScenarioHeader()
@Controller("categories")
export class SimpleCategoriesController {
  constructor(private readonly store: SimpleStore) {}

  @Get()
  @ApiOperation({ summary: "List product categories" })
  @ApiOkResponse({ type: CategoriesResponseDto })
  list(): CategoriesResponseDto {
    return { data: this.store.listCategories() };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one category" })
  @ApiOkResponse({ type: CategoryResponseDto })
  @ApiStandardErrors({ notFound: true })
  get(@Param("id") id: string): CategoryResponseDto {
    return { data: this.store.getCategory(id) };
  }
}

@ApiTags("Orders")
@ApiBearerAuth("jwt")
@ApiDemoScenarioHeader()
@UseGuards(SimpleJwtGuard)
@Controller("orders")
export class SimpleOrdersController {
  constructor(private readonly store: SimpleStore) {}

  @Get()
  @ApiOperation({ summary: "List orders visible to the current user" })
  @ApiOkResponse({ type: OrdersResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: DemoRequest,
    @Query() query: PageQueryDto,
  ): OrdersResponseDto {
    return this.store.listOrders(
      request.user!.id,
      request.user!.role,
      query.page,
      query.limit,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one visible order" })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  get(@Param("id") id: string, @Req() request: DemoRequest): OrderResponseDto {
    return {
      data: this.store.getOrder(id, request.user!.id, request.user!.role),
    };
  }

  @Post()
  @ApiOperation({ summary: "Create an order and validate product stock" })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiStandardErrors({ auth: true, conflict: true, unprocessable: true })
  create(
    @Req() request: DemoRequest,
    @Body() dto: CreateOrderDto,
  ): OrderResponseDto {
    return { data: this.store.createOrder(request.user!.id, dto) };
  }

  @Post(":id/cancel")
  @HttpCode(200)
  @ApiOperation({
    summary: "Cancel an order if its state permits the transition",
  })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true, conflict: true })
  cancel(
    @Param("id") id: string,
    @Req() request: DemoRequest,
  ): OrderResponseDto {
    return {
      data: this.store.cancelOrder(id, request.user!.id, request.user!.role),
    };
  }
}

@ApiTags("Testing")
@ApiDemoScenarioHeader()
@Controller("testing")
export class SimpleTestingController {
  constructor(
    private readonly store: SimpleStore,
    private readonly auth: SimpleAuthService,
  ) {}

  @Get("scenarios")
  @ApiOperation({ summary: "List deterministic X-Demo-Scenario values" })
  @ApiOkResponse({ type: ScenariosResponseDto })
  scenarios(): ScenariosResponseDto {
    return {
      data: [
        { name: "normal", description: "Default behavior." },
        {
          name: "slow",
          description:
            "Delays the response to exercise loading and cancellation states.",
        },
        {
          name: "timeout",
          description:
            "Delays long enough for a frontend timeout or cancellation.",
        },
        {
          name: "server-error",
          description: "Returns a deterministic 500 error.",
        },
        { name: "rate-limited", description: "Returns 429 with Retry-After." },
        {
          name: "empty",
          description: "Turns list responses into a valid empty state.",
        },
        {
          name: "expired-auth",
          description: "Makes protected routes return 401.",
        },
        {
          name: "forbidden",
          description: "Makes protected routes return 403.",
        },
        { name: "conflict", description: "Makes mutation routes return 409." },
        {
          name: "large-dataset",
          description: "Expands list responses to 250 deterministic items.",
        },
      ],
    };
  }

  @Post("reset")
  @HttpCode(200)
  @ApiOperation({ summary: "Reset all Simple API state and token revocations" })
  @ApiOkResponse({ type: TestingActionResponseDto })
  reset(): TestingActionResponseDto {
    this.store.reset("small");
    this.auth.reset();
    return {
      data: {
        success: true,
        message: "Simple API state reset to the default deterministic seed.",
      },
    };
  }

  @Post("seed/:preset")
  @HttpCode(200)
  @ApiParam({ name: "preset", enum: ["small", "large"] })
  @ApiOperation({ summary: "Select a small or large deterministic dataset" })
  @ApiOkResponse({ type: TestingActionResponseDto })
  seed(@Param("preset") preset: string): TestingActionResponseDto {
    if (preset !== "small" && preset !== "large") {
      throw new BadRequestException({
        code: "UNKNOWN_SEED_PRESET",
        message: "Preset must be small or large.",
      });
    }
    this.store.reset(preset);
    return {
      data: {
        success: true,
        message: `Simple API loaded the ${preset} dataset.`,
      },
    };
  }

  @Post("users/:userId/role")
  @HttpCode(200)
  @ApiOperation({
    summary: "Change a user role to exercise dynamic access control",
  })
  @ApiOkResponse({ type: SimpleUserResponseDto })
  @ApiStandardErrors({ notFound: true })
  changeRole(
    @Param("userId") userId: string,
    @Body() dto: ChangeSimpleRoleDto,
  ): SimpleUserResponseDto {
    return { data: this.store.changeRole(userId, dto.role) };
  }
}
