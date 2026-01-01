import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  ChatService,
  CreateSessionDto,
  UpdateSessionDto,
  SendMessageDto,
  SessionWithMessages,
  PaginatedSessions,
} from './chat.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createSessionSchema,
  updateSessionSchema,
  sendMessageSchema,
} from '@glint/validators';
import { ChatSession, ChatMessage } from '@glint/types';

@ApiTags('Chat')
@Controller('api/v1/chat')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List chat sessions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listSessions(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedSessions> {
    return this.chatService.listSessions(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create new chat session' })
  async createSession(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createSessionSchema)) data: CreateSessionDto,
  ): Promise<ChatSession> {
    return this.chatService.createSession(userId, data);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get chat session with messages' })
  async getSession(
    @CurrentUserId() userId: string,
    @Param('id') sessionId: string,
  ): Promise<SessionWithMessages> {
    return this.chatService.getSession(userId, sessionId);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update chat session' })
  async updateSession(
    @CurrentUserId() userId: string,
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(updateSessionSchema)) data: UpdateSessionDto,
  ): Promise<ChatSession> {
    return this.chatService.updateSession(userId, sessionId, data);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete chat session' })
  async deleteSession(
    @CurrentUserId() userId: string,
    @Param('id') sessionId: string,
  ): Promise<void> {
    return this.chatService.deleteSession(userId, sessionId);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send message to session' })
  async sendMessage(
    @CurrentUserId() userId: string,
    @Param('id') sessionId: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) data: SendMessageDto,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    return this.chatService.sendMessage(userId, sessionId, data);
  }
}
