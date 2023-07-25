import { Logger, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { Chat } from './class/chat.class';
import { Channel } from './class/channel.class';

@Module({
  // TODO: Member 와 관련된 것을 추가해야함
  providers: [ChatGateway, ChatService, Chat], // FIXME: Channel 은 어차피 Chat 으로 접근할거니까 필요 없겠지?
})
export class ChatModule {
  private logger: Logger = new Logger('ChatModule');
  constructor(private chat: Chat) {}
}
