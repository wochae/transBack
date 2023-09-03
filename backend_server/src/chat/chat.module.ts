import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Chat } from './class/chat.chat/chat.class';
import { DMChannelRepository, DirectMessageRepository } from './DM.repository';
import { TypeOrmExModule } from '../typeorm-ex.module';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';
import { Channel } from './class/chat.channel/channel.class';
import { Mode } from '../entity/chat.entity';
import { SharedModule } from 'src/shared/shared.module';
import { ChatController } from './chat.controller';
import { GameModule } from 'src/game/game.module';

@Module({
  // TODO: Member 와 관련된 것을 추가해야함
  imports: [
    TypeOrmExModule.forCustomRepository([
      // DMChannelRepository,
      DirectMessageRepository,
    ]),
    GameModule,
  ],
  providers: [ChatGateway, ChatService, Chat, InMemoryUsers, UsersService],
  controllers: [ChatController],
})
export class ChatModule {
  private logger: Logger = new Logger('ChatModule');
  constructor(
    private readonly chat: Chat,
    private readonly inMemoryUsers: InMemoryUsers,
    private readonly usersService: UsersService,
  ) {}

  public get getInMemoryUsers(): InMemoryUsers {
    return this.inMemoryUsers;
  }
}
