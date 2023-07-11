import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { chatProviders } from './chat.providers';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ChatController],
  providers: [ChatService, ...chatProviders],

})
export class ChatModule {}
