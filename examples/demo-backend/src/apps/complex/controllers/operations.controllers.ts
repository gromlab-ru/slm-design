import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiAcceptedResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import {
  ApiBinaryResponse,
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
import { ComplexRole } from "../dto/identity.dto";
import {
  AuditEventsResponseDto,
  AuditQueryDto,
  CursorQueryDto,
  FileResponseDto,
  FilesResponseDto,
  InventoryNotificationPayloadDto,
  JobResponseDto,
  NotificationResponseDto,
  NotificationsResponseDto,
  OrderNotificationPayloadDto,
  SystemNotificationPayloadDto,
} from "../dto/operations.dto";

@ApiTags("Notifications")
@ApiExtraModels(
  OrderNotificationPayloadDto,
  InventoryNotificationPayloadDto,
  SystemNotificationPayloadDto,
)
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({
    summary: "List polymorphic notifications using cursor pagination",
  })
  @ApiOkResponse({ type: NotificationsResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: ComplexDemoRequest,
    @Query() query: CursorQueryDto,
  ): NotificationsResponseDto {
    return this.store.listNotifications(
      request.organizationId!,
      query.cursor,
      query.limit,
    );
  }

  @Post(":id/read")
  @HttpCode(200)
  @UseGuards(ComplexCsrfGuard)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiOkResponse({ type: NotificationResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  markRead(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): NotificationResponseDto {
    return {
      data: this.store.markNotificationRead(request.organizationId!, id),
    };
  }
}

@ApiTags("Files")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("files")
export class FilesController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({ summary: "List uploaded file metadata" })
  @ApiOkResponse({ type: FilesResponseDto })
  @ApiStandardErrors({ auth: true })
  list(@Req() request: ComplexDemoRequest): FilesResponseDto {
    return { data: this.store.listFiles(request.organizationId!) };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiSecurity("csrf")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ApiOperation({
    summary: "Upload a file up to 5 MiB and retain it in memory",
  })
  @ApiCreatedResponse({ type: FileResponseDto })
  @ApiStandardErrors({ auth: true })
  upload(
    @Req() request: ComplexDemoRequest,
    @UploadedFile() file?: Express.Multer.File,
  ): FileResponseDto {
    if (!file)
      throw new BadRequestException({
        code: "FILE_REQUIRED",
        message: 'Multipart field "file" is required.',
      });
    return { data: this.store.addFile(request.organizationId!, file) };
  }

  @Get(":id/download")
  @ApiProduces("application/octet-stream")
  @ApiOperation({ summary: "Download an in-memory file" })
  @ApiBinaryResponse("Binary file content.")
  @ApiStandardErrors({ auth: true, notFound: true })
  download(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const file = this.store.getFile(request.organizationId!, id);
    response.setHeader("Content-Type", file.metadata.mimeType);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.metadata.name.replace(/"/g, "")}"`,
    );
    return new StreamableFile(file.content);
  }
}

@ApiTags("Audit")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard, ComplexRolesGuard)
@ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
@Controller("audit-events")
export class AuditController {
  constructor(private readonly store: ComplexStore) {}

  @Get()
  @ApiOperation({
    summary: "List immutable audit events using offset pagination",
  })
  @ApiOkResponse({ type: AuditEventsResponseDto })
  @ApiStandardErrors({ auth: true })
  list(
    @Req() request: ComplexDemoRequest,
    @Query() query: AuditQueryDto,
  ): AuditEventsResponseDto {
    return this.store.listAudit(request.organizationId!, query);
  }
}

@ApiTags("Background jobs")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller()
export class JobsController {
  constructor(private readonly store: ComplexStore) {}

  @Post("exports/orders")
  @HttpCode(202)
  @UseGuards(ComplexRolesGuard, ComplexCsrfGuard)
  @ComplexRoles(ComplexRole.Admin, ComplexRole.Manager)
  @ApiSecurity("csrf")
  @ApiOperation({ summary: "Start an asynchronous orders export" })
  @ApiAcceptedResponse({ type: JobResponseDto })
  @ApiStandardErrors({ auth: true })
  startExport(@Req() request: ComplexDemoRequest): JobResponseDto {
    return { data: this.store.startOrdersExport(request.organizationId!) };
  }

  @Get("jobs/:id")
  @ApiOperation({ summary: "Poll background job progress" })
  @ApiOkResponse({ type: JobResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  getJob(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): JobResponseDto {
    return { data: this.store.getJob(request.organizationId!, id) };
  }

  @Get("jobs/:id/result")
  @ApiProduces("text/csv")
  @ApiOperation({
    summary: "Download a completed export; returns 409 while processing",
  })
  @ApiBinaryResponse("Generated orders CSV.", "text/csv")
  @ApiStandardErrors({ auth: true, notFound: true, conflict: true })
  result(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Res({ passthrough: true }) response: Response,
  ): StreamableFile {
    const content = this.store.jobResult(request.organizationId!, id);
    response.setHeader("Content-Type", "text/csv");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="orders-${id}.csv"`,
    );
    return new StreamableFile(content);
  }
}
