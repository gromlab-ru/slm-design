import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiDemoScenarioHeader,
  ApiIdempotencyHeader,
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
  ComplexOrderResponseDto,
  ComplexOrdersResponseDto,
  CreateComplexOrderDto,
  CreateReviewDto,
  CustomerQueryDto,
  CustomerResponseDto,
  CustomersResponseDto,
  OrderCursorQueryDto,
  PaymentsResponseDto,
  PromotionsResponseDto,
  ReviewResponseDto,
  ReviewsResponseDto,
} from "../dto/commerce.dto";
import { ComplexRole } from "../dto/identity.dto";

@ApiTags("Customers")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("customers")
export class CustomersController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({
    summary: "List customers using offset pagination and search",
  })
  @ApiOkResponse({ type: CustomersResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: ComplexDemoRequest,
    @Query() query: CustomerQueryDto,
  ): CustomersResponseDto {
    return this.store.listCustomers(request.organizationId!, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one customer with nested address" })
  @ApiOkResponse({ type: CustomerResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  get(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): CustomerResponseDto {
    return { data: this.store.getCustomer(request.organizationId!, id) };
  }
}

@ApiTags("Orders")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("orders")
export class ComplexOrdersController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({ summary: "List tenant orders using cursor pagination" })
  @ApiOkResponse({ type: ComplexOrdersResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: ComplexDemoRequest,
    @Query() query: OrderCursorQueryDto,
  ): ComplexOrdersResponseDto {
    return this.store.listOrders(request.organizationId!, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one order and its state" })
  @ApiOkResponse({ type: ComplexOrderResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  get(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): ComplexOrderResponseDto {
    return { data: this.store.getOrder(request.organizationId!, id) };
  }

  @Post()
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager, ComplexRole.Support)
  @ApiSecurity("csrf")
  @ApiIdempotencyHeader()
  @ApiOperation({ summary: "Create an order idempotently" })
  @ApiCreatedResponse({ type: ComplexOrderResponseDto })
  @ApiStandardErrors({ auth: true, conflict: true })
  create(
    @Req() request: ComplexDemoRequest,
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() dto: CreateComplexOrderDto,
  ): ComplexOrderResponseDto {
    if (!idempotencyKey) {
      throw new BadRequestException({
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key header is required.",
      });
    }
    return {
      data: this.store.createOrder(
        request.organizationId!,
        request.user!.id,
        idempotencyKey,
        dto,
      ),
    };
  }

  @Post(":id/cancel")
  @HttpCode(200)
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager, ComplexRole.Support)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Apply a validated order state transition" })
  @ApiOkResponse({ type: ComplexOrderResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true, conflict: true })
  cancel(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): ComplexOrderResponseDto {
    return {
      data: this.store.cancelOrder(
        request.organizationId!,
        request.user!.id,
        id,
      ),
    };
  }
}

@ApiTags("Payments and promotions")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly store: ComplexStore) {}

  @Get("payments")
  @ApiOperation({ summary: "List payments for tenant orders" })
  @ApiOkResponse({ type: PaymentsResponseDto })
  @ApiStandardErrors({ auth: true })
  payments(@Req() request: ComplexDemoRequest): PaymentsResponseDto {
    return { data: this.store.listPayments(request.organizationId!) };
  }

  @Get("promotions")
  @ApiOperation({ summary: "List active and expired promotion contracts" })
  @ApiOkResponse({ type: PromotionsResponseDto })
  @ApiStandardErrors({ auth: true })
  promotions(): PromotionsResponseDto {
    return { data: this.store.listPromotions() };
  }
}

@ApiTags("Reviews")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({ summary: "List reviews with moderation state" })
  @ApiOkResponse({ type: ReviewsResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: ComplexDemoRequest,
    @Query("productId") productId?: string,
  ): ReviewsResponseDto {
    return { data: this.store.listReviews(request.organizationId!, productId) };
  }

  @Post()
  @UseGuards(ComplexCsrfGuard)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Create a review in pending moderation state" })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  create(
    @Req() request: ComplexDemoRequest,
    @Body() dto: CreateReviewDto,
  ): ReviewResponseDto {
    return { data: this.store.createReview(request.organizationId!, dto) };
  }
}
