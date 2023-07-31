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
import { UsersService } from 'src/users/users.service';
import { chatCreateRoomReqDto, chatCreateRoomResDto } from './dto/chat.dto';

const connectedClients = new Set<Socket>();
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3001'],
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly chatService: ChatService, private chat: Chat, private usersService: UsersService) {}
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
    connectedClients.add(client);
    this.logger.log(
      `[ 💬 Client ] { NickName } Connected _ 일단 소켓 ID 출력 ${client.id}`,
    );
  }

  handleDisconnect(client: Socket) {
    connectedClients.delete(client);
    this.logger.log(
      `[ 💬 Client ] { NickName } Disconnected _ 일단 소켓 ID 출력 ${client.id}`,
    );
  }

  /***************************** SOCKET API  *****************************/
  // FIXME: DTO 로 Json.parse 대체하기
  // API: MAIN_ENTER_0
  @SubscribeMessage('main_enter')
  enterMainPage(
    @ConnectedSocket() client: Socket,
    @MessageBody() intra: string,
  ) {
    // API: MAIN_ENTER_1
    this.server.emit('BR_main_enter', {
      nickname: 'jaekim',
      isOnline: true,
    });
    return;
  }

  // API: MAIN_PROFILE
  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string) {
    // // const targetProfile = await this.usersService.getProfile(targetNickname);
    // client.emit('target_profile', targetProfile);
    // console.log(targetProfile);
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

  // API: MAIN_CHAT_1
  @SubscribeMessage('create_dm')
  async createDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string,
  ) {
    // request data
    // {
    //   targetNickname,
    //   content(message),
    // }
    // response data
    // {
    //   Message,
    //   member[],
    //   channelIdx
    // }
    // roomId 방식
    // this.server.to().emit('', );
  }

  // API: MAIN_CHAT_2
  @SubscribeMessage('chat_enter')
  async enterProtectedAndPublicRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
    // 반환형 선언하기
  ) {
    // TODO: DTO 로 인자 유효성 검사 및 json 파싱하기
    const jsonData = JSON.parse(data);
    this.logger.log(
      `[ 💬 Socket API CALL ] 'chat_enter' _ nickname: ${jsonData.nickname}`,
    );
    if (this.chatService.checkAlreadyInRoom(jsonData)) {
      console.log('Already in Room');
      // FIXME: 이미 들어와있기 때문에 데이터 전송을 해야한다. ✅ 무한스크롤 이벤트 발생으로 해결 가능
      return 'Already in Room';
    }
    let channel: Channel = this.chatService.findProtectedChannelByRoomId(
      jsonData.roomId,
    );
    if (channel === null) {
      this.logger.log(`[ 💬 ] 이 채널은 공개방입니다.`);
      channel = this.chatService.findPublicChannelByRoomId(jsonData.roomId);
    } else {
      this.logger.log(`[ 💬 ] 이 채널은 비번방입니다.`);
    }
    return this.chatService.enterChatRoom(client, jsonData, channel);
  }

  // API: MAIN_CHAT_4
  @SubscribeMessage('chat_send_msg')
  sendChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    // request data
    // {
    //   roomId,
    //   message
    // }
    // response data
    // {
    //   message
    // }
    // 방식
    // client.to().emit('', );
  }

  // API: MAIN_CHAT_5
  @SubscribeMessage('chat_create_room')
  async createPrivateAndPublicChatRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() req: chatCreateRoomReqDto, // chatCreateRoomReqDto
  ) {
    // socket 을 통해 유저 식별값을 가지고 있다고 가정
    let res  = null;
    if (req.password === '') {
      res = await this.chatService.createPublicChatRoom(req);
    } else if (req.password !== '') {
      res = await this.chatService.createProtectedChatRoom(req);
    } else {
      throw new Error('비밀번호가 없습니다.');
    }
    client.emit('chat_room_created', res);

    const roomName = 'chat_' + res.channelIdx;
    client.join(roomName);
    client.to(roomName).emit('chat_room_created', res);
    // response data
    // {
    //   channel :{
    //     member[]?,
    //     channelIdx,
    //     password : true / false
    //   }
    // }
    // braodcast 방식
    const message = {
      event: 'chat_create_room',
      data: JSON.parse(res),
    };
    connectedClients.forEach(client => client.emit(message.event, message.data.toString()));
  }

  // API: MAIN_CHAT_6
  @SubscribeMessage('chat_room_admin')
  setChatAdmin(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    // {
    //   member,
    //   grant : boolean
    // }
    // response data
    // {
    //   member,
    //   grant
    // }
    // roomId 방식
    // client.to().emit('', );
  }



  // @SubscribeMessage('dm_start')
  // async handleCheckDM(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() targetNickname: string) {
  //   if (!this.chatService.checkDM(targetNickname)) {
  //     client.emit('not_found_dm'); // 여기서 찾을 수 없다는 메시지를 받으면 그 둘의 관련된 channel 페이지로 이동시킨다.
  //   } else { const { Message[], member[], channelIdx } = await this.chatService.getDM(targetNickname);
  //   to().emit('found_dm', { Message[], member[], channelIdx });
  //   }
  // }
  
  // @SubscribeMessage('createChat')
  // create(@MessageBody() createChatDto: CreateChatDto) {
  //   return this.chatService.create(createChatDto);
  // }

  // @SubscribeMessage('findAllChat')
  // findAll() {
  //   return this.chatService.findAll();
  // }

  // @SubscribeMessage('findOneChat')
  // findOne(@MessageBody() id: number) {
  //   return this.chatService.findOne(id);
  // }

  // @SubscribeMessage('updateChat')
  // update(@MessageBody() updateChatDto: UpdateChatDto) {
  //   return this.chatService.update(updateChatDto.id, updateChatDto);
  // }

  // @SubscribeMessage('removeChat')
  // remove(@MessageBody() id: number) {
  //   return this.chatService.remove(id);
  // }

  // API: MAIN_CHAT_7
  @SubscribeMessage('chat_room_password')
  setPassword(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    // {
    //   changed_password,
    // }
    // response data
    // {
    //   channel :{
    //     member[]?,
    //     channelIdx,
    //     password : true / false
    //   }
    // }
    // broadcast 방식
  }

  // API: MAIN_CHAT_8
  @SubscribeMessage('chat_room_exit')
  exitRoom(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    // {
    //   chat_user_id
    // }
    // response data
    // owner 가 나갈 경우 전달하고 나감.
    // {
    //  left_members[],
    //  owner
    // }
    // roomId 방식
  }

  // API: MAIN_CHAT_9
  @SubscribeMessage('chat_goto_lobby')
  goToLooby(@ConnectedSocket() client: Socket) {
    // request data
    // response data
    // {
    //   channel :{
    //     member[]?,
    //     channelIdx,
    //     password : true / false
    //   }
    // }
    // client 방식
  }

  // API: MAIN_CHAT_10
  @SubscribeMessage('chat_rooom_delete')
  deleteRoom(@ConnectedSocket() client: Socket) {
    // request data
    // response data
    //   {
    //     channel[] :{
    //      member[]?,
    //      channelIdx,
    //      password : true / false
    //    }
    //  }
    // broadcast 방식
  }

  // API: MAIN_CHAT_12
  @SubscribeMessage('chat_mute')
  setMute(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    // {
    //   target_nickname
    // }
    // response data
    // {
    //   friend[]
    // }
    // client 방식
  }

  // API: MAIN_CHAT_13
  @SubscribeMessage('chat_kick')
  kickMember(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    //  {
    //     roomId,
    //     target_nickname
    //  }
    // response data
    // {
    //   targetNickname,
    //   left_member[]
    // }
    // RoomId 방식
  }

  // API: MAIN_CHAT_14
  @SubscribeMessage('chat_ban')
  banMember(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    //  {
    //     roomId,
    //     target_nickname
    //  }
    // response data
    // {
    //   targetNickname,
    //   left_member[]
    // }
    // RoomId 방식
  }

  // API: MAIN_CHAT_15
  @SubscribeMessage('chat_block')
  blockMember(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    // request data
    //  {
    //     target_nickname
    //  }
    // response data
    // {
    //   blockList[]
    // }
    // client 방식
  }
}
