import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import {
  ApiDemoScenarioHeader,
  ApiOrganizationHeader,
  ApiStandardErrors,
} from "../../../common/api.decorators";
import { ChatGateway } from "../chat.gateway";
import {
  ComplexCookieGuard,
  ComplexCsrfGuard,
  type ComplexDemoRequest,
  ComplexOrganizationGuard,
} from "../complex.auth";
import { ComplexStore } from "../complex.store";
import {
  ConversationResponseDto,
  ConversationsResponseDto,
  MessageResponseDto,
  MessagesResponseDto,
  SendMessageDto,
} from "../dto/chat.dto";
import { CursorQueryDto } from "../dto/operations.dto";

@ApiTags("Chat")
@ApiCookieAuth("cookieSession")
@ApiOrganizationHeader()
@ApiDemoScenarioHeader()
@UseGuards(ComplexCookieGuard, ComplexOrganizationGuard)
@Controller("conversations")
export class ChatController {
  constructor(
    private readonly store: ComplexStore,
    private readonly gateway: ChatGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: "List conversations available to the current user" })
  @ApiOkResponse({ type: ConversationsResponseDto })
  @ApiStandardErrors({ auth: true })
  list(@Req() request: ComplexDemoRequest): ConversationsResponseDto {
    return {
      data: this.store.listConversations(
        request.organizationId!,
        request.user!.id,
      ),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one conversation" })
  @ApiOkResponse({ type: ConversationResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  get(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
  ): ConversationResponseDto {
    return {
      data: this.store.getConversation(
        request.organizationId!,
        request.user!.id,
        id,
      ),
    };
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "Load message history using cursor pagination" })
  @ApiOkResponse({ type: MessagesResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  messages(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Query() query: CursorQueryDto,
  ): MessagesResponseDto {
    return this.store.listMessages(
      request.organizationId!,
      request.user!.id,
      id,
      query.cursor,
      query.limit,
    );
  }

  @Post(":id/messages")
  @HttpCode(200)
  @UseGuards(ComplexCsrfGuard)
  @ApiSecurity("csrf")
  @ApiOperation({
    summary:
      "Send an idempotent message through REST and broadcast it over Socket.IO",
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiStandardErrors({ auth: true, notFound: true })
  send(
    @Req() request: ComplexDemoRequest,
    @Param("id") id: string,
    @Body() dto: SendMessageDto,
  ): MessageResponseDto {
    const message = this.store.sendMessage(
      request.organizationId!,
      request.user!.id,
      id,
      dto,
    );
    this.gateway.broadcastMessage(message);
    return { data: message };
  }
}
