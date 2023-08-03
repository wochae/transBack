import { Logger, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Chat } from './class/chat.class';
import { DMChannelRepository, DirectMessageRepository } from './DM.repository';
import { TypeOrmExModule } from '../typeorm-ex.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  // TODO: Member 와 관련된 것을 추가해야함
  imports: [
    TypeOrmExModule.forCustomRepository([
      DMChannelRepository,
      DirectMessageRepository,
    ]),
    UsersModule,
  ],
  providers: [ChatGateway, ChatService, Chat],
})
export class ChatModule {
  private logger: Logger = new Logger('ChatModule');
  constructor(private chat: Chat) {
    console.log('chat : ', chat);
  }
}
