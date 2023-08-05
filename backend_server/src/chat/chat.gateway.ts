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
import { Chat, MessageInfo } from './class/chat.class';
import { UsersService } from 'src/users/users.service';
import { chatCreateRoomReqDto } from './dto/chat.dto';
import { Mode } from './entities/chat.entity';
import { InMemoryUsers } from 'src/users/users.provider';
import { UserObject } from 'src/users/entities/users.entity';
import { Client } from 'socket.io/dist/client';
import { SendDMDto } from './dto/send-dm.dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3001'],
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
    private readonly inMemoryUsers: InMemoryUsers,
    private chat: Chat,
  ) {}
  private logger: Logger = new Logger('ChatGateway');

  /***************************** DEFAULT *****************************/
  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('[ 💬 Chat ] Initialized!');
  }

  handleConnection(client: Socket) {
    // TODO: 함수로 빼기
    const userId: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    // TODO: client.handshake.query.userId & intra 가 db 에 있는 userIdx & intra 와 일치한지 확인하는 함수 추가
    const user = this.inMemoryUsers.inMemoryUsers.find((user) => {
      return user.userIdx === userId;
    });
    if (!user) {
      this.logger.log(`[ ❗️ Client ] ${client.id} Not Found`);
      client.disconnect();
      return;
    }
    // TODO: 본인이 속한 DM 채널 idx 찾아서 roomId 에 join 하기
    // TODO: 이미 존재하는 member 인지 확인 필요
    // TODO: 소켓 객체가 아닌 소켓 ID 만 저장하면 되지 않을까?
    this.chat.setSocketList = this.chat.setSocketObject(client, user);
    this.logger.log(`[ 💬 Client ] ${user.nickname} Connected`);
  }

  async handleDisconnect(client: Socket) {
    const userId: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    const user = this.inMemoryUsers.getUserByIdFromIM(userId);
    if (user) {
      // TODO: disconnect 도 BR??
      // TODO: room 나가기, 소켓 리스트 지우기 등.
      await this.usersService.setIsOnline(user, false);
      await this.chat.removeSocketObject(
        this.chat.setSocketObject(client, user),
      );
      this.logger.log(
        `[ 💬 Client ] ${user.nickname} Disconnected _ 일단 소켓 ID 출력 ${client.id}`,
      );
    }
  }

  /***************************** SOCKET API  *****************************/
  // FIXME: gateway 에서 in memory 처리하는 것. service 로 보내기?
  // FIXME: 매개변수 DTO 로 Json.parse 대체하기
  @SubscribeMessage('main_enter')
  async enterMainPage(
    @ConnectedSocket() client: Socket,
    // TODO: intra 를 class 로 만들어서 DTO 처리?
    @MessageBody() payload: any,
  ) {
    // FIXME: Test 용으로 만들었기 때문에 지워야함. channel 생성하는 코드.
    // const testChannel = new Channel();
    // testChannel.setOwner = 'test';
    // testChannel.setChannelIdx = 0;
    // testChannel.setMode = Mode.PROTECTED;
    // this.chat.setProtectedChannels = testChannel;
    // // console.log('channelList1 : ', this.chat.getProtectedChannels);

    // const testChannel1 = new Channel();
    // testChannel1.setOwner = 'test1';
    // testChannel1.setChannelIdx = 1;
    // testChannel1.setMode = Mode.PUBLIC;
    // this.chat.setProtectedChannels = testChannel1;
    // // console.log('channelList2 : ', this.chat.getProtectedChannels);

    const { intra } = JSON.parse(payload);

    // API: MAIN_ENTER_0
    // TODO: 정리가 필요할듯
    const user = await this.inMemoryUsers.getUserByIntraFromIM(intra);
    if (!user) {
      this.logger.log(`[ ❗️ Client ] ${client.id} Not Found`);
      client.disconnect();
    }
    const userObject = {
      imgUri: user.imgUri,
      nickname: user.nickname,
      userIdx: user.userIdx,
    };
    const friendList = await this.usersService.getFriendList(intra);
    const blockList = await this.usersService.getBlockedList(intra);
    const channelList = this.chat.getProtectedChannels.map(
      ({ getOwner: owner, getChannelIdx: channelIdx, getMode: mode }) => ({
        owner,
        channelIdx,
        mode,
      }),
    );
    const main_enter = {
      friendList,
      channelList,
      blockList,
      userObject,
    };
    client.emit('main_enter', main_enter);

    // API: MAIN_ENTER_1
    await this.usersService.setIsOnline(user, true);
    const BR_main_enter = {
      targetNickname: user.nickname,
      targetIdx: user.userIdx,
      isOnline: user.isOnline,
    };
    this.server.emit('BR_main_enter', BR_main_enter);
    return;
  }

  // API: MAIN_PROFILE
  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const { targetNickname, targetIdx } = JSON.parse(payload);
    const user_profile = await this.inMemoryUsers.getUserByIdFromIM(targetIdx);

    if (!user_profile || user_profile.nickname !== targetNickname) {
      this.logger.log(`[ ❗️ Client ] ${targetNickname} Not Found`);
      client.disconnect();
    }
    // TODO: game 기록도 인메모리에서 관리하기로 했었나?? 전적 데이터 추가 필요
    client.emit('user_profile', user_profile);
  }

  // API: MAIN_CHAT_0
  @SubscribeMessage('check_dm')
  async handleCheckDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const { targetIdx } = JSON.parse(payload);
    const userId: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    // TODO: 논의 사항. 빈배열 대신에 boolean 해도 되나..?
    const check_dm: MessageInfo | boolean = await this.chatService.checkDM(
      userId,
      targetIdx,
    );
    client.emit('check_dm', check_dm);
  }

  // API: MAIN_CHAT_1
  @SubscribeMessage('create_dm')
  async createDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const { targetNickname, targetIdx, msg } = JSON.parse(payload);
    const userId: number = parseInt(
      client.handshake.query.userId as string,
      10,
    );
    const user: UserObject = await this.usersService.getUserInfoFromDB(
      this.inMemoryUsers.getUserByIdFromIM(userId).nickname,
    );
    // 오프라인일 수도 있기 때문에 db 에서 가져옴
    const targetUser: UserObject = await this.usersService.getUserInfoFromDB(
      targetNickname,
    );
    // TODO: connect 할 때 검사하는데 필요할까?
    if (!user || !targetUser) {
      this.logger.log(`[ ❗️ Client ] Not Found`);
      client.disconnect();
      return;
    }
    // DM 존재 여부 파악한다. 근데 이미 이전 단계에서 검사하기 때문에 필요없을 듯...? 하지만 동시에 생성될 수도 있다..?
    if (await this.chatService.checkDM(user.userIdx, targetUser.userIdx)) {
      console.log('이미 존재하는 DM 채널입니다.');
      return;
    }
    const message: SendDMDto = { msg: msg };
    const newChannelAndMsg = await this.chatService.createDM(
      client,
      user,
      targetUser,
      message,
    );

    this.server
      .to(`chat_room_${newChannelAndMsg.channelIdx}`)
      .emit('create_dm', newChannelAndMsg);
    return;
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
    // return this.chatService.enterChatRoom(client, jsonData, channel);
  }

  // API: MAIN_CHAT_4
  @SubscribeMessage('chat_send_msg')
  sendChatMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const jsonData = JSON.parse(data);
    this.logger.log(
      `[ 💬 Socket API CALL ] 'chat_send_msg' _ nickname: ${client.handshake.auth}`,
    );
    // // 채널 찾기
    const channel = this.chatService.findChannelByRoomId(jsonData.roomId);

    // // 메시지 저장 - 여기 부터는 service 로 옮기기
    // if (channel.getMode == Mode.PRIVATE) {
    //   // FIXME: client 소켓으로 sender 의 idx 를 찾아야한다.
    //   const message = new Message(channel.getChannelIdx, 1, jsonData.message);
    //   message.setMsgDate = new Date();
    //   channel.setMessage = message;
    //   this.chat.getPrivateChannels.push(channel);
    //   // TODO: DB 에 저장해야함.
    // } else {
    //   const message = new Message(channel.getChannelIdx, 1, jsonData.message);
    //   message.setMsgDate = new Date();
    //   channel.setMessage = message;
    //   this.chat.getProtectedChannels.push(channel);
    // }
    client.to(`Room${channel.getRoomId.toString()}`).emit('jsonData.message');
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
  // @SubscribeMessage('chat_create_room')
  // async createPrivateAndPublicChatRoom(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() req: chatCreateRoomReqDto, // chatCreateRoomReqDto
  // ) {
  //   // socket 을 통해 유저 식별값을 가지고 있다고 가정
  //   let res = null;
  //   if (req.password === '') {
  //     res = await this.chatService.createPublicChatRoom(req);
  //   } else if (req.password !== '') {
  //     res = await this.chatService.createProtectedChatRoom(req);
  //   } else {
  //     throw new Error('비밀번호가 없습니다.');
  //   }
  //   client.emit('chat_room_created', res);

  //   const roomName = 'chat_' + res.channelIdx;
  //   client.join(roomName);
  //   client.to(roomName).emit('chat_room_created', res);
  // response data
  // {
  //   channel :{
  //     member[]?,
  //     channelIdx,
  //     password : true / false
  //   }
  // }
  // braodcast 방식
  // const message = {
  //   event: 'chat_create_room',
  //   data: JSON.parse(res),
  // };
  // connectedClients.forEach((client) =>
  //   client.emit(message.event, message.data.toString()),
  // );
  // }

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
