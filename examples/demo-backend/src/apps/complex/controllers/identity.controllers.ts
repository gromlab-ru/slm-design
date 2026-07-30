import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiNoContentResponse,
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
import type { ComplexDemoRequest } from "../complex.auth";
import {
  ComplexCookieGuard,
  ComplexCsrfGuard,
  ComplexOrganizationGuard,
  ComplexRoles,
  ComplexRolesGuard,
  ComplexSessionService,
  CSRF_COOKIE,
  csrfCookieOptions,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "../complex.auth";
import { ComplexStore } from "../complex.store";
import {
  ComplexLoginDto,
  ComplexRole,
  ComplexUsersResponseDto,
  ComplexUserResponseDto,
  CookieSessionResponseDto,
  MembersResponseDto,
  OrganizationResponseDto,
  OrganizationsResponseDto,
} from "../dto/identity.dto";

@ApiTags("Auth")
@ApiDemoScenarioHeader()
@Controller("auth")
export class ComplexAuthController {
  constructor(private readonly sessions: ComplexSessionService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Login and establish HttpOnly cookie session" })
  @ApiOkResponse({
    type: CookieSessionResponseDto,
    headers: {
      "Set-Cookie": {
        description: "Sets demo_session (HttpOnly) and demo_csrf cookies.",
        schema: { type: "string" },
      },
    },
  })
  @ApiStandardErrors()
  login(
    @Body() dto: ComplexLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): CookieSessionResponseDto {
    const session = this.sessions.login(dto);
    this.setCookies(response, session.token, session.csrfToken);
    return this.sessions.response(session);
  }

  @Post("refresh")
  @HttpCode(200)
  @UseGuards(ComplexCookieGuard, ComplexCsrfGuard)
  @ApiCookieAuth("cookieSession")
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Rotate the current cookie session and CSRF token" })
  @ApiOkResponse({ type: CookieSessionResponseDto })
  @ApiStandardErrors({ auth: true })
  refresh(
    @Req() request: ComplexDemoRequest,
    @Res({ passthrough: true }) response: Response,
  ): CookieSessionResponseDto {
    const session = this.sessions.rotate(request.sessionToken!);
    this.setCookies(response, session.token, session.csrfToken);
    return this.sessions.response(session);
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(ComplexCookieGuard, ComplexCsrfGuard)
  @ApiCookieAuth("cookieSession")
  @ApiSecurity("csrf")
  @ApiOperation({
    summary: "Revoke cookie session and clear authentication cookies",
  })
  @ApiNoContentResponse()
  @ApiStandardErrors({ auth: true })
  logout(
    @Req() request: ComplexDemoRequest,
    @Res({ passthrough: true }) response: Response,
  ): void {
    this.sessions.revoke(request.sessionToken);
    response.clearCookie(SESSION_COOKIE, { path: "/" });
    response.clearCookie(CSRF_COOKIE, { path: "/" });
  }

  private setCookies(
    response: Response,
    token: string,
    csrfToken: string,
  ): void {
    response.cookie(SESSION_COOKIE, token, sessionCookieOptions());
    response.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  }
}

@ApiTags("Users")
@ApiCookieAuth("cookieSession")
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard)
@Controller("users")
export class ComplexUsersController {
  constructor(private readonly store: ComplexStore) {}

  @Get("me")
  @ApiOperation({
    summary: "Get the authenticated user and available organizations",
  })
  @ApiOkResponse({ type: ComplexUserResponseDto })
  @ApiStandardErrors({ auth: true })
  me(@Req() request: ComplexDemoRequest): ComplexUserResponseDto {
    const user = this.store.findUserById(request.user!.id)!;
    return { data: this.store.publicUser(user) };
  }

  @Get()
  @ApiOrganizationHeader()
  @UseGuards(ComplexOrganizationGuard, ComplexRolesGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiOperation({ summary: "List users in the current tenant" })
  @ApiOkResponse({ type: ComplexUsersResponseDto })
  @ApiStandardErrors({ auth: true })
  list(@Req() request: ComplexDemoRequest): ComplexUsersResponseDto {
    return { data: this.store.listUsers(request.organizationId!) };
  }
}

@ApiTags("Organizations")
@ApiCookieAuth("cookieSession")
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard)
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({ summary: "List organizations available to the current user" })
  @ApiOkResponse({ type: OrganizationsResponseDto })
  @ApiStandardErrors({ auth: true })
  list(@Req() request: ComplexDemoRequest): OrganizationsResponseDto {
    return { data: this.store.listOrganizations(request.user!.id) };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one available organization" })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  get(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): OrganizationResponseDto {
    return { data: this.store.getOrganization(id, request.user!.id) };
  }

  @Get(":id/members")
  @UseGuards(ComplexRolesGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiOperation({ summary: "List organization members and their roles" })
  @ApiOkResponse({ type: MembersResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  members(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): MembersResponseDto {
    this.store.getOrganization(id, request.user!.id);
    return { data: this.store.listMembers(id) };
  }
}
