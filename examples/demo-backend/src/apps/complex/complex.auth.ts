import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { CookieOptions, Request } from "express";
import type { DemoRequest } from "../../common/request.types";
import { assertNoForcedAuthFailure } from "../../common/scenario.interceptor";
import {
  ComplexRole,
  type ComplexLoginDto,
  type ComplexUserDto,
  type CookieSessionResponseDto,
} from "./dto/identity.dto";
import { ComplexStore } from "./complex.store";

export const SESSION_COOKIE = "demo_session";
export const CSRF_COOKIE = "demo_csrf";
const ROLES_METADATA = "complex-roles";

export interface ComplexDemoRequest extends DemoRequest {
  sessionToken?: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  csrfToken: string;
  expiresAt: number;
}

export interface CreatedSession {
  token: string;
  csrfToken: string;
  expiresAt: string;
  user: ComplexUserDto;
}

export const ComplexRoles = (...roles: ComplexRole[]) =>
  SetMetadata(ROLES_METADATA, roles);

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: Number(process.env.COOKIE_SESSION_TTL_MS ?? 1_800_000),
    path: "/",
  };
}

export function csrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: Number(process.env.COOKIE_SESSION_TTL_MS ?? 1_800_000),
    path: "/",
  };
}

@Injectable()
export class ComplexSessionService {
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(private readonly store: ComplexStore) {}

  login(dto: ComplexLoginDto): CreatedSession {
    const user = this.store.findUserByEmail(dto.email);
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }
    return this.create(user.id);
  }

  get(token: string | undefined): SessionRecord | undefined {
    if (!token) return undefined;
    const session = this.sessions.get(token);
    if (!session) return undefined;
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return undefined;
    }
    return session;
  }

  rotate(token: string): CreatedSession {
    const existing = this.get(token);
    if (!existing)
      throw new UnauthorizedException({
        code: "SESSION_EXPIRED",
        message: "Cookie session is missing or expired.",
      });
    this.sessions.delete(token);
    return this.create(existing.userId);
  }

  revoke(token: string | undefined): void {
    if (token) this.sessions.delete(token);
  }

  expire(token: string | undefined): void {
    const session = token ? this.sessions.get(token) : undefined;
    if (session) session.expiresAt = 0;
  }

  reset(): void {
    this.sessions.clear();
  }

  response(session: CreatedSession): CookieSessionResponseDto {
    return {
      data: {
        user: session.user,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt,
      },
    };
  }

  private create(userId: string): CreatedSession {
    const user = this.store.findUserById(userId);
    if (!user)
      throw new UnauthorizedException({
        code: "USER_NOT_FOUND",
        message: "Session user no longer exists.",
      });
    const ttl = Number(process.env.COOKIE_SESSION_TTL_MS ?? 1_800_000);
    const record: SessionRecord = {
      token: randomUUID(),
      userId,
      csrfToken: randomUUID(),
      expiresAt: Date.now() + ttl,
    };
    this.sessions.set(record.token, record);
    return {
      token: record.token,
      csrfToken: record.csrfToken,
      expiresAt: new Date(record.expiresAt).toISOString(),
      user: this.store.publicUser(user),
    };
  }
}

@Injectable()
export class ComplexCookieGuard implements CanActivate {
  constructor(
    private readonly sessions: ComplexSessionService,
    private readonly store: ComplexStore,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>() as ComplexDemoRequest;
    assertNoForcedAuthFailure(request);
    const cookies = request.cookies as Record<string, string> | undefined;
    const token = cookies?.[SESSION_COOKIE];
    const session = this.sessions.get(token);
    if (!session)
      throw new UnauthorizedException({
        code: "SESSION_EXPIRED",
        message: "Cookie session is missing or expired.",
      });
    const user = this.store.findUserById(session.userId);
    if (!user)
      throw new UnauthorizedException({
        code: "USER_NOT_FOUND",
        message: "Session user no longer exists.",
      });
    request.user = this.store.publicUser(user);
    request.sessionToken = token;
    return true;
  }
}

@Injectable()
export class ComplexCsrfGuard implements CanActivate {
  constructor(private readonly sessions: ComplexSessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request>() as ComplexDemoRequest;
    const session = this.sessions.get(request.sessionToken);
    const headerToken = request.headers["x-csrf-token"];
    const cookieToken = (
      request.cookies as Record<string, string> | undefined
    )?.[CSRF_COOKIE];
    if (
      !session ||
      typeof headerToken !== "string" ||
      headerToken !== session.csrfToken ||
      cookieToken !== session.csrfToken
    ) {
      throw new ForbiddenException({
        code: "CSRF_INVALID",
        message:
          "A matching X-CSRF-Token header and demo_csrf cookie are required.",
      });
    }
    return true;
  }
}

@Injectable()
export class ComplexOrganizationGuard implements CanActivate {
  constructor(private readonly store: ComplexStore) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ComplexDemoRequest>();
    const organizationId = request.headers["x-organization-id"];
    if (typeof organizationId !== "string" || organizationId.length === 0) {
      throw new BadRequestException({
        code: "ORGANIZATION_REQUIRED",
        message: "X-Organization-Id header is required.",
      });
    }
    if (
      !request.user ||
      !this.store.isMember(request.user.id, organizationId)
    ) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "The user is not an active member of this organization.",
      });
    }
    request.organizationId = organizationId;
    return true;
  }
}

@Injectable()
export class ComplexRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<ComplexRole[]>(
      ROLES_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<ComplexDemoRequest>();
    if (!request.user || !required.includes(request.user.role as ComplexRole)) {
      throw new ForbiddenException({
        code: "ROLE_FORBIDDEN",
        message: `One of these roles is required: ${required.join(", ")}.`,
      });
    }
    return true;
  }
}
