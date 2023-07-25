import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3000'],
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService) {}
  private logger: Logger = new Logger('ChatGateway');

  /***************************** DEFAULT *****************************/
  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('💬 ChatGateway Initialized!');
  }

  // TODO: MAIN_ENTER_0 구현을 여기에 해야하지 않을까 싶음.
  handleConnection(client: Socket) {
    // TODO: 인메모리에 유저에 대한 정보 저장하기
    // TODO: 해당 socket 을 갖고 있는 유저 intra 또는 nicnkname 찾아서 출력?
    this.logger.log(
      `💬 Client { NickName } connected _ 일단 소켓 ID 출력 ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `💬 Client { NickName } disconnected _ 일단 소켓 ID 출력 ${client.id}`,
    );
  }
  /***************************** SOCKET API  *****************************/

  // MAIN_PROFILE
  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string,
  ) {
    // const targetProfile = await this.chatService.getProfile(targetNickname);
    // client.emit('target_profile', targetProfile);
  }

  // MAIN_CHAT_0
  @SubscribeMessage('check_dm')
  async handleCheckDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string,
  ) {
    // if (!this.chatService.checkDM(targetNickname)) {
    //   client.emit('not_found_dm'); // 여기서 찾을 수 없다는 메시지를 받으면 그 둘의 관련된 channel 페이지로 이동시킨다.
    // } else { const { Message[], member[], channelIdx } = await this.chatService.getDM(targetNickname);
    // client.emit('found_dm', { Message[], member[], channelIdx });
    // }
  }

  // MAIN_CHAT_2

}
