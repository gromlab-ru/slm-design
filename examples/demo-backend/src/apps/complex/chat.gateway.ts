import { parse as parseCookie } from "cookie";
import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { ComplexSessionService, SESSION_COOKIE } from "./complex.auth";
import { ComplexStore } from "./complex.store";
import type { ChatMessageDto, SendMessageDto } from "./dto/chat.dto";

interface ChatSocketData {
  userId: string;
  organizationIds: string[];
}

interface ChatContextPayload {
  organizationId: string;
  conversationId: string;
}

interface SocketMessagePayload extends ChatContextPayload, SendMessageDto {}

@WebSocketGateway({
  namespace: "/chat",
  cors: { origin: true, credentials: true },
  transports: ["websocket", "polling"],
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly sessions: ComplexSessionService,
    private readonly store: ComplexStore,
  ) {}

  handleConnection(client: Socket): void {
    const cookies = parseCookie(client.handshake.headers.cookie ?? "");
    const session = this.sessions.get(cookies[SESSION_COOKIE]);
    const user = session ? this.store.findUserById(session.userId) : undefined;
    if (!session || !user) {
      client.emit("chat:error", {
        code: "SESSION_EXPIRED",
        message: "Valid demo_session cookie is required.",
      });
      client.disconnect(true);
      return;
    }
    client.data = {
      userId: user.id,
      organizationIds: user.organizationIds,
    } satisfies ChatSocketData;
    this.logger.debug(`Socket ${client.id} connected as ${user.id}`);
  }

  @SubscribeMessage("chat:join")
  join(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatContextPayload,
  ) {
    try {
      const data = client.data as ChatSocketData;
      this.assertOrganization(data, payload.organizationId);
      this.store.getConversation(
        payload.organizationId,
        data.userId,
        payload.conversationId,
      );
      void client.join(this.room(payload.conversationId));
      return {
        event: "chat:joined",
        data: { conversationId: payload.conversationId },
      };
    } catch (error) {
      return { event: "chat:error", data: this.socketError(error) };
    }
  }

  @SubscribeMessage("chat:leave")
  leave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatContextPayload,
  ) {
    void client.leave(this.room(payload.conversationId));
    return {
      event: "chat:left",
      data: { conversationId: payload.conversationId },
    };
  }

  @SubscribeMessage("message:send")
  send(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SocketMessagePayload,
  ) {
    try {
      const data = client.data as ChatSocketData;
      this.assertOrganization(data, payload.organizationId);
      const message = this.store.sendMessage(
        payload.organizationId,
        data.userId,
        payload.conversationId,
        payload,
      );
      this.broadcastMessage(message);
      return { event: "message:ack", data: message };
    } catch (error) {
      return { event: "chat:error", data: this.socketError(error) };
    }
  }

  @SubscribeMessage("typing:start")
  typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatContextPayload,
  ): void {
    this.broadcastTyping(client, payload, true);
  }

  @SubscribeMessage("typing:stop")
  typingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatContextPayload,
  ): void {
    this.broadcastTyping(client, payload, false);
  }

  broadcastMessage(message: ChatMessageDto): void {
    this.server
      .to(this.room(message.conversationId))
      .emit("message:created", message);
  }

  private broadcastTyping(
    client: Socket,
    payload: ChatContextPayload,
    active: boolean,
  ): void {
    const data = client.data as ChatSocketData;
    if (!data.organizationIds.includes(payload.organizationId)) return;
    client
      .to(this.room(payload.conversationId))
      .emit(active ? "typing:started" : "typing:stopped", {
        conversationId: payload.conversationId,
        userId: data.userId,
      });
  }

  private assertOrganization(
    data: ChatSocketData,
    organizationId: string,
  ): void {
    if (!data.organizationIds.includes(organizationId))
      throw new Error("Organization is unavailable to this user.");
  }

  private room(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private socketError(error: unknown): { code: string; message: string } {
    return {
      code: "CHAT_OPERATION_FAILED",
      message:
        error instanceof Error ? error.message : "Chat operation failed.",
    };
  }
}
