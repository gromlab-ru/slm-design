import { IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CursorMetaDto } from "../../../common/api.dto";

export class ConversationDto {
  @ApiProperty({ example: "conversation-support" })
  id!: string;

  @ApiProperty({ example: "org-acme" })
  organizationId!: string;

  @ApiProperty({ example: "Order support" })
  title!: string;

  @ApiProperty({
    type: [String],
    example: ["complex-user-admin", "complex-user-support"],
  })
  participantIds!: string[];

  @ApiProperty({
    nullable: true,
    example: "Can you check order complex-order-001?",
  })
  lastMessagePreview!: string | null;

  @ApiProperty({ format: "date-time" })
  updatedAt!: string;
}

export class ConversationsResponseDto {
  @ApiProperty({ type: [ConversationDto] })
  data!: ConversationDto[];
}

export class ConversationResponseDto {
  @ApiProperty({ type: ConversationDto })
  data!: ConversationDto;
}

export class ChatMessageDto {
  @ApiProperty({ example: "message-001" })
  id!: string;

  @ApiProperty({ example: "conversation-support" })
  conversationId!: string;

  @ApiProperty({ example: "complex-user-support" })
  senderId!: string;

  @ApiProperty({ example: "The order has already been packed." })
  text!: string;

  @ApiProperty({
    example: "client-message-4c08",
    description: "Frontend-generated key used to deduplicate retries.",
  })
  clientMessageId!: string;

  @ApiProperty({ format: "date-time" })
  createdAt!: string;
}

export class MessagesResponseDto {
  @ApiProperty({ type: [ChatMessageDto] })
  data!: ChatMessageDto[];

  @ApiProperty({ type: CursorMetaDto })
  meta!: CursorMetaDto;
}

export class SendMessageDto {
  @ApiProperty({ example: "The order has already been packed." })
  @IsString()
  @MinLength(1)
  text!: string;

  @ApiProperty({ example: "client-message-4c08" })
  @IsString()
  @MinLength(3)
  clientMessageId!: string;
}

export class MessageResponseDto {
  @ApiProperty({ type: ChatMessageDto })
  data!: ChatMessageDto;
}
