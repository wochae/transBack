import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { chatProviders } from 'src/chat/chat.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [ChatController, DatabaseModule],
  providers: [ChatService, ...chatProviders, ],
  exports: [ChatService, ...chatProviders, ],
})
export class ChatModule {}
