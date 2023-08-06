import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Chat } from './class/chat.class';
import { DMChannelRepository, DirectMessageRepository } from './DM.repository';
import { TypeOrmExModule } from '../typeorm-ex.module';
import { UsersModule } from 'src/users/users.module';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';

@Module({
  // TODO: Member 와 관련된 것을 추가해야함
  imports: [
    TypeOrmExModule.forCustomRepository([
      DMChannelRepository,
      DirectMessageRepository,
    ]),
    UsersModule,
  ],
  providers: [ChatGateway, ChatService, Chat, InMemoryUsers],
})
export class ChatModule {
  private logger: Logger = new Logger('ChatModule');
  constructor(
    private readonly chat: Chat,
    private readonly inMemoryUsers: InMemoryUsers,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    await this.initializeInMemoryDataFromDatabase();
  }

  private async initializeInMemoryDataFromDatabase() {
    const usersFromDatabase = await this.usersService.getAllUsersFromDB();
    this.inMemoryUsers.inMemoryUsers = usersFromDatabase;
  }
}
