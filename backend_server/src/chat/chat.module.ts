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

@Module({
  // TODO: Member 와 관련된 것을 추가해야함
  imports: [
    TypeOrmExModule.forCustomRepository([
      // DMChannelRepository,
      DirectMessageRepository,
    ]),
    SharedModule,
  ],
  providers: [ChatGateway, ChatService, Chat, InMemoryUsers],
  controllers: [ChatController],
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
    // FIXME: Test 용으로 만들었기 때문에 지워야함. channel 생성하는 코드.
    // channel 10 에는 jeekim 과 클라이언트
    // channel 11 에는 haryu 와 클라이언트가 들어가있음.비번은 1234
    const testChannel = new Channel();
    testChannel.setOwner = await this.usersService.getUserInfoFromDB('jeekim');
    testChannel.setAdmin = await this.usersService.getUserInfoFromDB('jeekim');
    testChannel.setMember = await this.usersService.getUserInfoFromDB('jeekim');
    testChannel.setChannelIdx = 10;
    testChannel.setMode = Mode.PUBLIC;
    testChannel.setPassword = '';
    this.chat.setProtectedChannels = testChannel;
    console.log(testChannel.getOwner);

    const testChannel1 = new Channel();
    testChannel1.setOwner = await this.usersService.getUserInfoFromDB('haryu');
    testChannel1.setAdmin = await this.usersService.getUserInfoFromDB('haryu');
    testChannel1.setMember = await this.usersService.getUserInfoFromDB('haryu');
    testChannel1.setChannelIdx = 11;
    testChannel1.setMode = Mode.PROTECTED;
    testChannel1.setPassword = '1234';
    this.chat.setProtectedChannels = testChannel1;
  }

  private async initializeInMemoryDataFromDatabase() {
    const usersFromDatabase = await this.usersService.getAllUsersFromDB();
    this.inMemoryUsers.inMemoryUsers = usersFromDatabase;

    const blockListFromDatabase =
      await this.usersService.getAllBlockedListFromDB();
    this.inMemoryUsers.inMemoryBlockList = blockListFromDatabase;
  }
}
