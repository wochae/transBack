// TODO: try catch 로 에러 처리하기
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
import { Socket, Server } from 'socket.io';
import { Channel } from './class/channel.class';
import { Chat } from './class/chat.class';
import { error } from 'console';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3001'],
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService, private chat: Chat) {}
  private logger: Logger = new Logger('ChatGateway');

  /***************************** DEFAULT *****************************/
  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('[ 💬 Chat ] Initialized!');
  }

  // TODO: MAIN_ENTER_0 구현을 여기에 해야하지 않을까 싶음.
  handleConnection(client: Socket, ...args: any[]) {
    // TODO: 인메모리에 유저에 대한 정보 저장하기
    // TODO: 해당 socket 을 갖고 있는 유저 intra 또는 nicnkname 찾아서 출력?
    this.logger.log(
      `[ 💬 Client ] { NickName } Connected _ 일단 소켓 ID 출력 ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `[ 💬 Client ] { NickName } Disconnected _ 일단 소켓 ID 출력 ${client.id}`,
    );
  }

  /***************************** SOCKET API  *****************************/

  // API: MAIN_PROFILE
  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string,
  ) {
    // const targetProfile = await this.chatService.getProfile(targetNickname);
    // client.emit('target_profile', targetProfile);
  }

  // API: MAIN_CHAT_0
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

  // API: MAIN_CHAT_2
  @SubscribeMessage('chat_enter')
  async enterProtectedAndPublicRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
    // 반환형 선언하기
  ) {
    // TODO: DTO 로 data 인자 유효성 검사
    // const chatDTO = new ChatDTO();
    // { nickname, roomId, password } = chatDTO;
    const jsonData = JSON.parse(data);
    console.log('nickname : ', jsonData.nickname);
    console.log('roomId : ', jsonData.roomId);
    console.log('password :', jsonData.password);
    this.logger.log(
      `[ 💬 Socket API ] 'chat_enter' _ nickname: ${jsonData.nickname}`,
    );
    // TODO: 이미 들어가있는 방인지 확인하는 부분 추가하기
    // TODO: 비밀번호 확인부 모듈로 나누기?
    // - 비밀번호 확인 (존재하면 비밀번호 확인, 존재하지 않으면 그냥 입장)
    // 1. roomid 로 chat 객체 안에 있는 Channel 을 찾는다.
    let protectedChannel: Channel =
      this.chatService.findProtectedChannelByRoomId(jsonData.roomId);
    // console.log('protectedChannel : ', protectedChannel);
    if (protectedChannel == null) {
      this.logger.log(`[ 💬 ] 이 채널은 공개방입니다.`);
      protectedChannel = this.chatService.findPublicChannelByRoomId(
        jsonData.roomId,
      );
    } else {
      this.logger.log(`[ 💬 ] 이 채널은 비번방입니다.`);
      // 2. 비밀번호 확인
      if (protectedChannel != null) {
        if (protectedChannel.getPassword !== jsonData.password) {
          client.emit('wrong_password');
          this.logger.log(`[ 💬 Socket API ] 'chat_enter _ Wrong_password`);
          return new error('wrong_password');
        }
      }
    }
    return this.chatService.enterChatRoom(client, jsonData, protectedChannel);
  }
}

// length 테스트할 때 썼던 코드
// jsonData.nickname = new Channel();
// jsonData.nickname.setChannelIdx = 1;
// console.log('jaekim ChannelIdx: ', jsonData.nickname.getChannelIdx);
// this.chat.setPrivateChannels = jsonData.nickname;
// console.log('Push Success');
// console.log('length: ', this.chat.getPrivateChannels.length);
