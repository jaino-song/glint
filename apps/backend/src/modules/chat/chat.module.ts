import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GeminiChatService } from './gemini-chat.service';
import { NotionModule } from '../notion/notion.module';

@Module({
  imports: [NotionModule],
  controllers: [ChatController],
  providers: [ChatService, GeminiChatService],
  exports: [ChatService, GeminiChatService],
})
export class ChatModule {}
