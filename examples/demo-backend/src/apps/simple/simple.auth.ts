import { randomUUID } from "node:crypto";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { DemoRequest } from "../../common/request.types";
import { assertNoForcedAuthFailure } from "../../common/scenario.interceptor";
import {
  type JwtAuthResponseDto,
  type JwtTokensDto,
  type LoginDto,
  type RefreshTokenDto,
  SimpleRole,
} from "./simple.dto";
import { SimpleStore } from "./simple.store";

interface DemoJwtPayload {
  sub: string;
  type: "access" | "refresh";
  jti: string;
}

@Injectable()
export class SimpleAuthService {
  private readonly revokedRefreshTokens = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly store: SimpleStore,
  ) {}

  async login(dto: LoginDto): Promise<JwtAuthResponseDto> {
    const user = this.store.findUserByEmail(dto.email);
    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "Email or password is incorrect.",
      });
    }
    return {
      data: {
        tokens: await this.issueTokens(user.id),
        user: this.store.publicUser(user),
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<JwtAuthResponseDto> {
    let payload: DemoJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<DemoJwtPayload>(
        dto.refreshToken,
        { secret: this.refreshSecret },
      );
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is invalid or expired.",
      });
    }
    if (
      payload.type !== "refresh" ||
      this.revokedRefreshTokens.has(payload.jti)
    ) {
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_REUSED",
        message: "Refresh token was revoked or already used.",
      });
    }
    const user = this.store.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: "USER_NOT_FOUND",
        message: "Token user no longer exists.",
      });
    }
    this.revokedRefreshTokens.add(payload.jti);
    return {
      data: {
        tokens: await this.issueTokens(user.id),
        user: this.store.publicUser(user),
      },
    };
  }

  async logout(dto: RefreshTokenDto): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<DemoJwtPayload>(
        dto.refreshToken,
        { secret: this.refreshSecret },
      );
      this.revokedRefreshTokens.add(payload.jti);
    } catch {
      // Logout remains idempotent even when the token has already expired.
    }
  }

  reset(): void {
    this.revokedRefreshTokens.clear();
  }

  private async issueTokens(userId: string): Promise<JwtTokensDto> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();
    const accessTtl = process.env.JWT_ACCESS_TTL ?? "60s";
    const refreshTtl = process.env.JWT_REFRESH_TTL ?? "7d";
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, type: "access", jti: accessJti },
        { secret: this.accessSecret, expiresIn: accessTtl as never },
      ),
      this.jwtService.signAsync(
        { sub: userId, type: "refresh", jti: refreshJti },
        { secret: this.refreshSecret, expiresIn: refreshTtl as never },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds(accessTtl),
      tokenType: "Bearer",
    };
  }

  private accessTtlSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 60;
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return Number(match[1]) * multipliers[match[2] as keyof typeof multipliers];
  }

  private get accessSecret(): string {
    return process.env.JWT_ACCESS_SECRET ?? "demo-access-secret-change-me";
  }

  private get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? "demo-refresh-secret-change-me";
  }
}

@Injectable()
export class SimpleJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly store: SimpleStore,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>() as DemoRequest;
    assertNoForcedAuthFailure(request);
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "JWT_MISSING",
        message: "Bearer access token is required.",
      });
    }
    try {
      const payload = await this.jwtService.verifyAsync<DemoJwtPayload>(
        authorization.slice(7),
        {
          secret:
            process.env.JWT_ACCESS_SECRET ?? "demo-access-secret-change-me",
        },
      );
      if (payload.type !== "access") throw new Error("Wrong token type");
      const user = this.store.findUserById(payload.sub);
      if (!user) throw new Error("Unknown user");
      request.user = this.store.publicUser(user);
      return true;
    } catch {
      throw new UnauthorizedException({
        code: "JWT_INVALID",
        message: "Access token is invalid or expired.",
      });
    }
  }
}

@Injectable()
export class SimpleAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<DemoRequest>();
    if (request.user?.role !== SimpleRole.Admin) {
      throw new ForbiddenException({
        code: "ADMIN_REQUIRED",
        message: "Administrator role is required.",
      });
    }
    return true;
  }
}
