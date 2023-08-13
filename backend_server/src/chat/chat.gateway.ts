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
import { DMChannel, Mode } from '../entity/chat.entity';
import { InMemoryUsers } from 'src/users/users.provider';
import { Permission, UserObject } from 'src/entity/users.entity';
import { SendDMDto } from './dto/send-dm.dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3000'],
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
    const userId: number = parseInt(client.handshake.query.userId as string);
    // TODO: client.handshake.query.userId & intra 가 db 에 있는 userIdx & intra 와 일치한지 확인하는 함수 추가
    const user = this.inMemoryUsers.inMemoryUsers.find((user) => {
      return user.userIdx === userId;
    });
    if (!user) {
      console.log(`[ ❗️ Client ] ${client.id} Not Found`);
      client.disconnect();
      return;
    }
    // TODO: 본인이 속한 DM 채널 idx 찾아서 roomId 에 join 하기
    const dmChannelList: Promise<DMChannel[]> =
      this.chatService.findPrivateChannelByUserIdx(user.userIdx);
    dmChannelList.then((channels) => {
      channels.forEach((channel) => {
        client.join(`chat_room_${channel.channelIdx}`);
      });
    });
    // FIXME: 테스트용  코드
    client.join('chat_room_10');
    // client.join('chat_room_11');

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
      // TODO: Public, Protected 도 채널 나가기 -> 테스트 필요 -> 근데 이게 필요한지 모르겠음.
      const notDmChannelList: Channel[] = this.chat.getProtectedChannels;
      const channelForLeave: Channel[] = notDmChannelList.filter((channel) =>
        channel.getMember.includes(user),
      );
      await channelForLeave.forEach((channel) => {
        client.leave(`chat_room_${channel.getChannelIdx}`);
      });
      const dmChannelList: Promise<DMChannel[]> =
        this.chatService.findPrivateChannelByUserIdx(user.userIdx);
      await dmChannelList.then((channels) => {
        channels.forEach((channel) => {
          client.leave(`chat_room_${channel.channelIdx}`);
        });
      });
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
    // const { intra } = payload;
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
        owner: owner.nickname,
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
    return 200;
  }

  // API: MAIN_PROFILE
  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const { targetNickname, targetIdx } = JSON.parse(payload);
    // const { targetNickname, targetIdx } = payload;
    const user_profile = await this.inMemoryUsers.getUserByIdFromIM(targetIdx);

    if (!user_profile || user_profile.nickname !== targetNickname) {
      this.logger.log(`[ ❗️ Client ] ${targetNickname} Not Found`);
      client.disconnect();
    }
    // TODO: game 기록도 인메모리에서 관리하기로 했었나?? 전적 데이터 추가 필요
    client.emit('user_profile', user_profile);
  }

  // API: MAIN_CHAT_0
  // FIXME: msgDate 같이 반환, DM 이 없는 경우 return 으로 false
  @SubscribeMessage('check_dm')
  async handleCheckDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { targetIdx } = payload;
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
    if (check_dm === false) {
      client.emit('check_dm', []);
      return check_dm;
    } else {
      client.emit('check_dm', check_dm);
    }
  }

  // API: MAIN_CHAT_1
  @SubscribeMessage('create_dm')
  async createDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    // const { targetNickname, targetIdx, msg } = payload;
    const { targetNickname, targetIdx, msg } = JSON.parse(payload);
    const userId: number = parseInt(client.handshake.query.userId as string);
    const user: UserObject = await this.usersService.getUserInfoFromDB(
      this.inMemoryUsers.getUserByIdFromIM(userId).nickname,
    );
    // 오프라인일 수도 있기 때문에 db 에서 가져옴
    const targetUser: UserObject = await this.usersService.getUserInfoFromDB(
      targetNickname,
    );
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
    if (!newChannelAndMsg) {
      console.log('DM 채널 생성에 실패했습니다.');
      return '실패';
    }
    // TODO: Block 검사
    const checkBlock = await this.usersService.checkBlockList(user, targetUser);
    if (checkBlock) {
      console.log('차단된 유저입니다.');
      return;
    }
    this.server
      .to(`chat_room_${newChannelAndMsg.channelIdx}`)
      .emit('create_dm', newChannelAndMsg);
    return '성공';
  }

  // API: MAIN_CHAT_2
  @SubscribeMessage('chat_enter')
  async enterProtectedAndPublicRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
    // 반환형 선언하기
  ) {
    // TODO: DTO 로 인자 유효성 검사 및 json 파싱하기
    const { userNickname, userIdx, channelIdx, password } = JSON.parse(payload);
    // const jsonData = payload;
    this.logger.log(
      `[ 💬 Socket API CALL ] 'chat_enter' _ nickname: ${userNickname}`,
    );
    let channel: any = await this.chatService.findChannelByRoomId(channelIdx);
    const user: UserObject = await this.inMemoryUsers.getUserByIdFromIM(
      userIdx,
    );
    // ban 체크
    if (channel.getBan.some((member) => member.userIdx === userIdx)) {
      this.logger.log(`[ 💬 ] ${user.nickname} 은 차단된 유저입니다.`);
      return `${user.nickname} 은 차단된 유저입니다.`;
    }
    if (channel instanceof Channel) {
      if (channel.getPassword === '') {
        this.logger.log(`[ 💬 ] 이 채널은 공개방입니다.`);
        channel = await this.chatService.enterPublicRoom(user, channel);
      } else {
        this.logger.log(`[ 💬 ] 이 채널은 비번방입니다.`);
        if (channel.getPassword !== password) {
          this.logger.log(`[ 💬 ] 비밀번호가 틀렸습니다.`);
          // FIXME: 에러 코드로 보내기
          return false;
        }
        channel = await this.chatService.enterProtectedRoom(user, channel);
      }
    }
    client.join(`chat_room_${channel.channelIdx}`);
    client.emit('chat_enter', channel);

    // API: MAIN_CHAT_3
    const member = channel.member.map((member) => {
      return {
        nickname: member.nickname,
        imgUri: member.imgUri,
        permission: member.permission,
      };
    });
    this.server
      .to(`chat_room_${channel.channelIdx}`)
      .emit('chat_enter_noti', member);
    // const member = channel.member.find(
    //   (member) => member.nickname === user.nickname,
    // );
    // if (member) {
    //   const memberInfo = {
    //     nickname: member.nickname,
    //     imgUri: member.imgUri,
    //     permission: member.permission,
    //   };
    //   this.server
    //     .to(`chat_room_${channel.channelIdx}`)
    //     .emit('chat_enter_noti', memberInfo);
    // } else {
    //   // FIXME: 예외처리 필요
    //   console.log('Member not found');
    // }
    // console.log(channel);
    return;
  }

  // API: MAIN_CHAT_4
  @SubscribeMessage('chat_send_msg')
  async sendChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { channelIdx, senderIdx, msg } = payload;
    const { channelIdx, senderIdx, msg } = JSON.parse(payload);
    const userId: number = parseInt(client.handshake.query.userId as string);
    const user: UserObject = await this.usersService.getUserInfoFromDB(
      this.inMemoryUsers.getUserByIdFromIM(userId).nickname,
    );
    // FIXME: 테스트용 코드 ------------------------------------------------------
    const testChannel: Channel | DMChannel =
      await this.chatService.findChannelByRoomId(channelIdx);
    if (testChannel instanceof Channel) {
      testChannel.setMember = await this.usersService.getUserInfoFromDBById(
        senderIdx,
      );
    }
    // ------------------------------------------------------------------------
    this.logger.log(
      `[ 💬 Socket API CALL ] 'chat_send_msg' _ nickname: ${client.handshake.auth}`,
    );
    const channel: Channel | DMChannel =
      await this.chatService.findChannelByRoomId(channelIdx);

    if (channel instanceof Channel) {
      const msgInfo = await this.chatService.saveMessageInIM(
        channelIdx,
        senderIdx,
        msg,
      );
      this.server.to(`chat_room_${channelIdx}`).emit('chat_send_msg', msgInfo);
    } else if (channel instanceof DMChannel) {
      const message: SendDMDto = { msg: msg };
      const msgInfo = await this.chatService
        .saveMessageInDB(channelIdx, senderIdx, message)
        .then((msgInfo) => {
          return {
            channelIdx: channelIdx,
            senderIdx: senderIdx,
            msg: message.msg,
            msgDate: msgInfo.msgDate,
          };
        });
      console.log(msgInfo);
      // TODO: channelIdx 로 Block 검사
      // const checkBlock = await this.usersService.checkBlockList(
      //   user,
      //   channelIdx,
      // );
      // if (checkBlock) {
      //   console.log('차단된 유저입니다.');
      //   return;
      // }
      this.server.to(`chat_room_${channelIdx}`).emit('chat_send_msg', msgInfo);
    } else {
      // 예상하지 못한 타입일 경우 처리
      console.log('Unexpected type of channel');
    }
  }

  // API: MAIN_CHAT_5
  @SubscribeMessage('BR_chat_create_room')
  async createPrivateAndPublicChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any, // chatCreateRoomReqDto
  ) {
    const { password = '' } = JSON.parse(payload);
    // const { password = null } = payload;
    const userId: number = parseInt(client.handshake.query.userId as string);
    const user = await this.inMemoryUsers.inMemoryUsers.find((user) => {
      return user.userIdx === userId;
    });
    const channelInfo = await this.chatService.createPublicAndProtected(
      password,
      user,
    );
    client.join(`chat_room_${channelInfo.channelIdx}`);
    this.server.emit('BR_chat_create_room', channelInfo);
  }

  // API: MAIN_CHAT_6
  @SubscribeMessage('chat_room_admin')
  async setAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const { channelIdx, userIdx, grant } = JSON.parse(payload);
    const ownerId: number = parseInt(client.handshake.query.userId as string);
    const channel = this.chat.getProtectedChannel(channelIdx);

    // owner 유효성 검사
    const owner: UserObject = channel.getMember.find((member) => {
      return member.userIdx === ownerId;
    });
    if (owner === undefined) {
      return '요청자가 대화방에 없습니다.';
    }
    const isOwner: boolean = channel.getOwner.userIdx === owner.userIdx;
    if (!isOwner) {
      return '요청자가 owner 가 아닙니다.';
    }

    // 대상 유효성 검사
    const target = channel.getMember.find((member) => {
      return member.userIdx === userIdx;
    });
    if (target === undefined) {
      return '대상이 채널에 없습니다.';
    }

    // 대상 권한 검사
    const checkGrant = channel.getAdmin.some(
      (admin) => admin.userIdx === target.userIdx,
    );
    if (grant === checkGrant) {
      return '이미 권한이 부여되어있습니다.';
    }

    // 대상 권한 부여 및 emit
    const adminInfo = this.chatService.setAdmin(channel, target, grant);
    this.server
      .to(`chat_room_${channelIdx}`)
      .emit('chat_room_admin', adminInfo);
    return '권한 부여 완료';
  }

  // API: MAIN_CHAT_7
  @SubscribeMessage('BR_chat_room_password')
  changePassword(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const { channelIdx, userIdx, changePassword } = JSON.parse(payload);
    const ownerId: number = parseInt(client.handshake.query.userId as string);
    const channel = this.chat.getProtectedChannel(channelIdx);

    // owner 유효성 검사
    const owner: UserObject = channel.getMember.find((member) => {
      return member.userIdx === ownerId;
    });
    if (owner === undefined) {
      return '요청자가 대화방에 없습니다.';
    }
    const isOwner: boolean = channel.getOwner.userIdx === owner.userIdx;
    if (!isOwner) {
      return '요청자가 owner 가 아닙니다.';
    }
    const channelInfo = this.chatService.changePassword(
      channel,
      changePassword,
    );
    console.log(channelInfo);
    // broadcast 방식
    this.server.emit('BR_chat_room_password', channelInfo);
  }

  // API: MAIN_CHAT_9
  @SubscribeMessage('chat_goto_lobby')
  goToLobby(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const { channelIdx, userIdx } = JSON.parse(payload);
    const channel = this.chat.getProtectedChannel(channelIdx);
    const user: UserObject = channel.getMember.find((member) => {
      return member.userIdx === userIdx;
    });
    if (user === undefined) {
      return '요청자가 대화방에 없습니다.';
    }
    const channelInfo = this.chatService.goToLobby(client, channel, user);
    client.emit('chat_room_exit', channelInfo);

    // API: MAIN_CHAT_10
    const isEmpty = this.chatService.checkEmptyChannel(channel);
    if (isEmpty) {
      const channels = this.chatService.removeEmptyChannel(channel);
      this.server.emit('BR_chat_room_delete', channels);
      return '채널이 삭제되었습니다. 로비로 이동합니다.';
    }

    // API: MAIN_CHAT_8
    const announce = this.chatService.exitAnnounce(channel);
    this.server.to(`chat_room_${channelIdx}`).emit('chat_room_exit', announce);
    return '로비로 이동합니다.';
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
  kickMember(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const { channelIdx, targetNciname, targetIdx } = JSON.parse(payload);
    const requestId: number = parseInt(client.handshake.query.userId as string);
    const channel = this.chat.getProtectedChannel(channelIdx);

    // console.log(channel);
    // owner 유효성 검사
    const requester: UserObject = channel.getMember.find((member) => {
      return member.userIdx === requestId;
    });
    if (requester === undefined) {
      return '요청자가 대화방에 없습니다.';
    }
    const clientIsAdmin: boolean = channel.getAdmin.some(
      (admin) => admin.userIdx === requester.userIdx,
    );
    if (clientIsAdmin) {
      return '요청자가 적절한 권한자가 아닙니다.';
    }
    // 대상 유효성 검사
    const target = channel.getMember.find((member) => {
      return member.userIdx === targetIdx;
    });
    if (target === undefined) {
      return '대상이 채널에 없습니다.';
    }
    // 대상 권한 검사
    const targetIsAdmin: boolean = channel.getAdmin.some((admin) => {
      return admin.userIdx === target.userIdx;
    });
    if (targetIsAdmin) {
      return '대상을 퇴장할 수 없습니다.';
    }
    // 대상이 나간걸 감지 후 emit
    const channelInfo = this.chatService.kickMember(channel, target);
    this.server
      .to(`chat_room_${channelIdx}`)
      .emit('chat_room_exit', channelInfo);
    // console.log(channel);
    return;
  }

  // API: MAIN_CHAT_14
  @SubscribeMessage('chat_ban')
  banMember(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
    const { channelIdx, targetNickname, targetIdx } = JSON.parse(payload);
    const requestId: number = parseInt(client.handshake.query.userId as string);
    const channel = this.chat.getProtectedChannel(channelIdx);

    console.log(channel);
    // owner 유효성 검사
    const requester: UserObject = channel.getMember.find((member) => {
      return member.userIdx === requestId;
    });
    if (requester === undefined) {
      return '요청자가 대화방에 없습니다.';
    }
    const clientIsAdmin: boolean = channel.getAdmin.some(
      (admin) => admin.userIdx === requester.userIdx,
    );
    if (!clientIsAdmin) {
      return '요청자가 적절한 권한자가 아닙니다.';
    }
    // 대상 유효성 검사
    const target = channel.getMember.find((member) => {
      return member.userIdx === targetIdx;
    });
    if (target === undefined) {
      return '대상이 채널에 없습니다.';
    }
    // 대상 권한 검사
    const targetIsAdmin: boolean = channel.getAdmin.some((admin) => {
      return admin.userIdx === target.userIdx;
    });
    if (targetIsAdmin) {
      return '대상을 퇴장할 수 없습니다.';
    }

    // 대상 ban 처리 및 emit
    const banInfo = this.chatService.setBan(channel, target);
    console.log('after ban : ', channel);
    this.server.to(`chat_room_${channelIdx}`).emit('chat_room_admin', banInfo);
    return 'ban 처리 되었습니다.';
  }

  // API: MAIN_CHAT_15
  @SubscribeMessage('chat_block')
  async blockMember(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    // FIXME: targetnickname 과 targetIdx 가 서로 맞는지 비교
    // FIXME: targetIdx 가 본인인지 확인
    const { targetNickname, targetIdx } = JSON.parse(payload);
    const requestId: number = parseInt(client.handshake.query.userId as string);

    const user: UserObject = this.inMemoryUsers.getUserByIdFromIM(requestId);
    const blockInfo = await this.usersService.setBlock(targetNickname, user);
    client.emit('chat_block', blockInfo);
  }

  // API: MAIN_CHAT_16
  @SubscribeMessage('chat_get_roomList')
  getPublicAndProtectedChannel(@ConnectedSocket() client: Socket) {
    const channels = this.chatService.getPublicAndProtectedChannel();
    client.emit('chat_get_roomList', channels);
    return;
  }

  // API: MAIN_CHAT_17
  @SubscribeMessage('chat_get_DMList')
  async getPrivateChannels(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const { userNickname, userIdx } = JSON.parse(payload);
    const userId = parseInt(client.handshake.query.userId as string);
    const user: UserObject = this.inMemoryUsers.getUserByIdFromIM(userId);
    const channels = await this.chatService.getPrivateChannels(user);
    client.emit('chat_get_DMList', channels);
    return;
  }

  // API: MAIN_CHAT_18
  @SubscribeMessage('chat_get_DM')
  async getPrivateChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { targetIdx } = payload;
    const { channelIdx } = JSON.parse(payload);
    const dm: MessageInfo = await this.chatService.getPrivateChannel(
      channelIdx,
    );
    client.emit('check_dm', dm);
  }
}
