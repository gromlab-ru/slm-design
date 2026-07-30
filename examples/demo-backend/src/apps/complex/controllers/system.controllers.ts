import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiDemoScenarioHeader,
  ApiStandardErrors,
} from "../../../common/api.decorators";
import {
  HealthResponseDto,
  ScenariosResponseDto,
  TestingActionResponseDto,
} from "../../../common/api.dto";
import {
  ComplexCookieGuard,
  ComplexCsrfGuard,
  type ComplexDemoRequest,
  ComplexSessionService,
} from "../complex.auth";
import { ComplexStore } from "../complex.store";
import {
  ChangeComplexRoleDto,
  ComplexUserResponseDto,
} from "../dto/identity.dto";

@ApiTags("Health")
@ApiDemoScenarioHeader()
@Controller("health")
export class ComplexHealthController {
  @Get()
  @ApiOperation({ summary: "Check Complex API availability" })
  @ApiOkResponse({ type: HealthResponseDto })
  health(): HealthResponseDto {
    return {
      data: {
        application: "complex",
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }
}

@ApiTags("Testing")
@ApiDemoScenarioHeader()
@Controller("testing")
export class ComplexTestingController {
  constructor(
    private readonly store: ComplexStore,
    private readonly sessions: ComplexSessionService,
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
  @ApiOperation({ summary: "Reset all Complex API data and active sessions" })
  @ApiOkResponse({ type: TestingActionResponseDto })
  reset(): TestingActionResponseDto {
    this.store.reset("small");
    this.sessions.reset();
    return {
      data: {
        success: true,
        message:
          "Complex API state and sessions reset to the default deterministic seed.",
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
        message: `Complex API loaded the ${preset} dataset.`,
      },
    };
  }

  @Post("session/expire")
  @HttpCode(200)
  @UseGuards(ComplexCookieGuard, ComplexCsrfGuard)
  @ApiCookieAuth("cookieSession")
  @ApiSecurity("csrf")
  @ApiOperation({
    summary: "Expire the current cookie session after this response",
  })
  @ApiOkResponse({ type: TestingActionResponseDto })
  @ApiStandardErrors({ auth: true })
  expireSession(@Req() request: ComplexDemoRequest): TestingActionResponseDto {
    this.sessions.expire(request.sessionToken);
    return {
      data: { success: true, message: "Current cookie session expired." },
    };
  }

  @Post("users/:userId/role")
  @HttpCode(200)
  @ApiOperation({ summary: "Change a role while sessions remain active" })
  @ApiOkResponse({ type: ComplexUserResponseDto })
  @ApiStandardErrors({ notFound: true })
  changeRole(
    @Param("userId") userId: string,
    @Body() dto: ChangeComplexRoleDto,
  ): ComplexUserResponseDto {
    return { data: this.store.changeUserRole(userId, dto.role) };
  }
}
