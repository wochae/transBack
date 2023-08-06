import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Chat } from './class/chat.class';
import { DMChannelRepository, DirectMessageRepository } from './DM.repository';
import { TypeOrmExModule } from '../typeorm-ex.module';
import { UsersModule } from 'src/users/users.module';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';
import { Channel } from './class/channel.class';
import { Mode } from './entities/chat.entity';

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
    // channel 10 에는 jakeim 과 클라이언트
    // channel 11 에는 haryu 와 클라이언트가 들어가있음.비번은 1234
    // FIXME: Test 용으로 만들었기 때문에 지워야함. channel 생성하는 코드.
    const testChannel = new Channel();
    testChannel.setOwner = await this.usersService.getUserInfoFromDB('jaekim');
    testChannel.setChannelIdx = 10;
    testChannel.setMode = Mode.PUBLIC;
    this.chat.setProtectedChannels = testChannel;

    const testChannel1 = new Channel();
    testChannel1.setOwner = await this.usersService.getUserInfoFromDB('haryu');
    testChannel1.setChannelIdx = 11;
    testChannel1.setMode = Mode.PROTECTED;
    testChannel1.setPassword = '1234';
    this.chat.setProtectedChannels = testChannel1;
  }

  private async initializeInMemoryDataFromDatabase() {
    const usersFromDatabase = await this.usersService.getAllUsersFromDB();
    this.inMemoryUsers.inMemoryUsers = usersFromDatabase;
  }
}
