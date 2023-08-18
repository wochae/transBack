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
import { Channel } from './class/chat.channel/channel.class';
import { Chat, MessageInfo } from './class/chat.chat/chat.class';
import { UsersService } from 'src/users/users.service';
import { DMChannel, Mode } from '../entity/chat.entity';
import { InMemoryUsers } from 'src/users/users.provider';
import { OnlineStatus, UserObject } from 'src/entity/users.entity';
import { SendDMDto } from './dto/send-dm.dto';
import { GameInvitationDto } from './dto/game.invitation.dto';
import { ReturnMsgDto } from 'src/game/dto/error.message.dto';
import {
  GameInvitationAnswerDto,
  GameInvitationAnswerPassDto,
} from './dto/game.invitation.answer.dto';
import { GameInvitationAskDto } from './dto/game.invitation.ask.dto';
import { LoggerWithRes } from 'src/shared/class/shared.response.msg/shared.response.msg';

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
  private messanger: LoggerWithRes = new LoggerWithRes('ChatGateway');
  private logger: Logger = new Logger('ChatGateway');

  /***************************** DEFAULT *****************************/
  @WebSocketServer()
  server: Server;

  afterInit() {
    this.messanger.logWithMessage('afterInit', 'ChatGateway', 'Initialized!');
  }

  handleConnection(client: Socket) {
    const userId: number = parseInt(client.handshake.query.userId as string);
    // TODO: client.handshake.query.userId & intra 가 db 에 있는 userIdx & intra 와 일치한지 확인하는 함수 추가
    // FIXME: 함수로 빼기
    const user = this.inMemoryUsers.getUserByIdFromIM(userId);
    if (!user) {
      client.disconnect();
      return this.messanger.setResponseErrorMsgWithLogger(
        400,
        'Not Found',
        userId,
        'handleConnection',
      );
    }
    //
    // FIXME: 함수로 빼기
    const dmChannelList: Promise<DMChannel[]> =
      this.chatService.findPrivateChannelByUserIdx(user.userIdx);
    dmChannelList.then((channels) => {
      channels.forEach((channel) => {
        client.join(`chat_room_${channel.channelIdx}`);
      });
    });
    //
    // FIXME: 테스트용 코드 지우기
    client.join('chat_room_10');
    client.join('chat_room_11');
    //
    this.chat.setSocketList = this.chat.setSocketObject(client, user);
    this.messanger.logWithMessage('handleConnection', 'user', user.nickname);
  }

  async handleDisconnect(client: Socket) {
    const userId: number = parseInt(client.handshake.query.userId as string);
    // FIXME: 함수로 빼기
    const user = this.inMemoryUsers.getUserByIdFromIM(userId);
    if (!user) {
      client.disconnect();
      return this.messanger.setResponseErrorMsgWithLogger(
        400,
        'Not Found',
        userId,
        'handleDisconnection',
      );
    }
    //
    // FIXME: 함수로 빼기
    this.chat.removeSocketObject(this.chat.setSocketObject(client, user));
    const notDmChannelList: Channel[] = this.chat.getProtectedChannels;
    const channelForLeave: Channel[] = notDmChannelList.filter((channel) =>
      channel.getMember.includes(user),
    );
    channelForLeave.forEach((channel) => {
      client.leave(`chat_room_${channel.getChannelIdx}`);
    });
    const dmChannelList: Promise<DMChannel[]> =
      this.chatService.findPrivateChannelByUserIdx(user.userIdx);
    dmChannelList.then((channels) => {
      channels.forEach((channel) => {
        client.leave(`chat_room_${channel.channelIdx}`);
      });
    });
    //
    await this.usersService.setIsOnline(user, OnlineStatus.OFFLINE);
    return this.messanger.setResponseMsgWithLogger(
      200,
      'Disconnect Done',
      'handleDisconnect',
    );
  }

  /***************************** SOCKET API  *****************************/
  // FIXME: 매개변수 DTO 로 Json.parse 대체하기
  // API: MAIN_ENTER_0
  @SubscribeMessage('main_enter')
  async enterMainPage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { intra } = payload;
    const { intra } = JSON.parse(payload);

    // FIXME: 1. connect 된 소켓의 유저 인트라와 요청한 인트라가 일치하는지 확인하는 함수 추가 필요
    const user = await this.inMemoryUsers.getUserByIntraFromIM(intra);
    // FIXME: 2. 예외처리 함수 만들기
    if (!user) {
      client.disconnect();
      return this.messanger.logWithWarn(
        'enterMainPage',
        'intra',
        intra,
        'Not Found',
      );
    }
    //
    // FIXME: 3. emit value 만드는 함수로 빼기, DTO 만들기?
    const userObject = {
      imgUri: user.imgUri,
      nickname: user.nickname,
      userIdx: user.userIdx,
    };
    const friendList = await this.usersService.getFriendList(intra);
    const blockList = await this.inMemoryUsers.getBlockListByIdFromIM(
      user.userIdx,
    );
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
    //
    client.emit('main_enter', main_enter);

    // API: MAIN_ENTER_1
    // FIXME: DTO 만들기?
    await this.usersService.setIsOnline(user, OnlineStatus.ONLINE);
    const BR_main_enter = {
      targetNickname: user.nickname,
      targetIdx: user.userIdx,
      isOnline: user.isOnline,
    };
    this.server.emit('BR_main_enter', BR_main_enter);
    return this.messanger.setResponseMsgWithLogger(
      200,
      'Done Enter Main Page and Notice to Others',
      'BR_main_enter',
    );
  }

  // API: MAIN_PROFILE
  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { targetNickname, targetIdx } = JSON.parse(payload);
    const { targetNickname, targetIdx } = payload;
    // FIXME: 함수로 빼기
    const user = await this.inMemoryUsers.getUserByIdFromIM(targetIdx);
    if (!user || user.nickname !== targetNickname) {
      client.disconnect();
      return this.messanger.setResponseErrorMsgWithLogger(
        400,
        'Not Found',
        targetNickname,
        'user_profile',
      );
    }
    //
    // FIXME: game 기록도 인메모리에서 관리하기로 했었나?? 전적 데이터 추가 필요
    client.emit('user_profile', user);
    return this.messanger.setResponseMsgWithLogger(
      200,
      'Done Get Profile',
      'user_profile',
    );
  }

  // API: MAIN_CHAT_0
  @SubscribeMessage('check_dm')
  async handleCheckDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const { targetIdx } = payload;
    // const { targetIdx } = JSON.parse(payload);
    const userId: number = parseInt(client.handshake.query.userId as string);
    const check_dm: MessageInfo | boolean = await this.chatService.checkDM(
      userId,
      targetIdx,
    );
    if (check_dm === false) {
      client.emit('check_dm', []);
      // FIXME: emit 으로 처리하는지, return false 로 처리하는지 질문
      return false;
    } else {
      client.emit('check_dm', check_dm);
    }
    return this.messanger.setResponseMsgWithLogger(
      200,
      'Done Check DM',
      'check_dm',
    );
  }

  // API: MAIN_CHAT_1.
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
    // TODO: Block 검사
    const checkBlock = await this.usersService.checkBlockList(
      user,
      this.inMemoryUsers,
      targetUser,
    );
    const newChannelAndMsg = await this.chatService.createDM(
      client,
      user,
      targetUser,
      message,
      checkBlock,
    );
    if (!newChannelAndMsg) {
      console.log('DM 채널 생성에 실패했습니다.');
      return '실패';
    }
    this.server
      .to(`chat_room_${newChannelAndMsg.channelIdx}`)
      .emit('create_dm', newChannelAndMsg);
    return 200;
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
    // const { userNickname, userIdx, channelIdx, password } = payload;
    // const jsonData = payload;
    this.logger.log(
      `[ 💬 Socket API CALL ] 'chat_enter' _ nickname: ${userNickname}`,
    );
    console.log('payload : ', payload);
    let channel: any = await this.chatService.findChannelByRoomId(channelIdx);
    const user: UserObject = await this.inMemoryUsers.getUserByIdFromIM(
      userIdx,
    );
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
    console.log('MAIN_CHAT_2 : ', channel.admin);
    const member = await channel.member?.map((member) => {
      return {
        userIdx: member.userIdx,
        nickname: member.nickname,
        imgUri: member.imgUri,
      };
    });
    const admin = await channel.admin?.map((member) => {
      return {
        nickname: member.nickname,
      };
    });
    if (member) {
      const newMember = await member.find(
        (member) => member.userIdx === userIdx,
      );
      if (newMember) {
        const memberInfo = {
          member: member,
          admin: admin,
          newMember: newMember.nickname,
        };
        console.log('MAIN_CHAT_3 memberInfo: ', memberInfo);
        // FIXME: 새로 들어온 멤버도 같이 보내기
        this.server
          .to(`chat_room_${channel.channelIdx}`)
          .emit('chat_enter_noti', memberInfo);
      } else {
        console.log('MAIN_CHAT_3', '멤버가 없습니다.');
      }
    } else {
      console.log('MAIN_CHAT_3', '멤버가 정의되지 않았습니다.');
      return '멤버가 정의되지 않았습니다.';
    }
    return 200;
  }

  // API: MAIN_CHAT_4
  @SubscribeMessage('chat_send_msg')
  async sendChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { channelIdx, senderIdx, msg, targetIdx } = payload;
    const { channelIdx, senderIdx, msg, targetIdx } = JSON.parse(payload);
    const userId: number = parseInt(client.handshake.query.userId as string);
    const user: UserObject = this.inMemoryUsers.getUserByIdFromIM(userId);
    const target: UserObject = this.inMemoryUsers.getUserByIdFromIM(targetIdx);
    // FIXME: 테스트용 코드 ------------------------------------------------------
    // const testChannel: Channel | DMChannel =
    //   await this.chatService.findChannelByRoomId(channelIdx);
    // if (testChannel instanceof Channel) {
    //   testChannel.setMember = await this.usersService.getUserInfoFromDBById(
    //     senderIdx,
    //   );
    // }
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

      // TODO: userId 로 Mute 검사
      const checkMute = this.chatService.checkMuteList(channel, user);
      if (checkMute) {
        console.log('뮤트된 유저입니다.');
        return '뮤트되었습니다.';
      }
      await this.server
        .to(`chat_room_${channelIdx}`)
        .emit('chat_send_msg', msgInfo);
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
      // TODO: target 로 Block 검사
      const checkBlock = await this.usersService.checkBlockList(
        user,
        this.inMemoryUsers,
        target,
      );
      if (checkBlock) {
        console.log('차단된 유저입니다.');
        return '차단되었습니다.';
      }
      this.server.to(`chat_room_${channelIdx}`).emit('chat_send_msg', msgInfo);
    } else {
      // 예상하지 못한 타입일 경우 처리
      console.log('Unexpected type of channel');
    }
    return 200;
  }

  // API: MAIN_CHAT_5
  @SubscribeMessage('BR_chat_create_room')
  async createPrivateAndPublicChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any, // chatCreateRoomReqDto
  ) {
    console.log('payload : ', payload);
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
    return 200;
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
    return 200;
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
    return 200;
  }

  // API: MAIN_CHAT_9
  @SubscribeMessage('chat_goto_lobby')
  goToLobby(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    // const { channelIdx, userIdx } = JSON.parse(payload);
    const { channelIdx, userIdx } = payload;
    const channel = this.chat.getProtectedChannel(channelIdx);
    const user: UserObject = channel.getMember.find((member) => {
      return member.userIdx === userIdx;
    });
    if (!user) {
      return '요청자가 대화방에 없습니다.';
    }
    const channelInfo = this.chatService.goToLobby(client, channel, user);
    client.emit('chat_goto_lobby', channelInfo);

    // API: MAIN_CHAT_10
    const isEmpty = this.chatService.checkEmptyChannel(channel);
    if (isEmpty) {
      const channels = this.chatService.removeEmptyChannel(channel);
      this.server.emit('BR_chat_room_delete', channels);
      // return '채널이 삭제되었습니다. 로비로 이동합니다.';
      return 200;
    }

    // API: MAIN_CHAT_8
    const announce = this.chatService.exitAnnounce(channel);
    this.server.to(`chat_room_${channelIdx}`).emit('chat_room_exit', announce);
    // return '로비로 이동합니다.';
    return 200;
  }

  // API: MAIN_CHAT_12
  @SubscribeMessage('chat_mute')
  setMute(@ConnectedSocket() client: Socket, @MessageBody() payload: string) {
    const { channelIdx, targetNickname, targetIdx } = JSON.parse(payload);
    const requestId: number = parseInt(client.handshake.query.userId as string);
    const channel: Channel = this.chat.getProtectedChannel(channelIdx);

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
      return '대상을 뮤트할 수 없습니다.';
    }
    let muteInfo = this.chatService.setMute(channel, target, true);

    // 방 입장 시각을 기준으로 30초 후에 뮤트 해제
    setTimeout(() => {
      muteInfo = this.chatService.setMute(channel, target, false);
      this.server.to(`chat_room_${channelIdx}`).emit('chat_mute', muteInfo);
    }, 10000);
    this.server.to(`chat_room_${channelIdx}`).emit('chat_mute', muteInfo);
    // return '뮤트 처리 되었습니다.';
    return 200;
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
    // 대상이 나간걸 감지 후 emit
    const channelInfo = this.chatService.kickMember(channel, target);
    this.server
      .to(`chat_room_${channelIdx}`)
      .emit('chat_room_exit', channelInfo);
    // console.log(channel);
    return 200;
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
    // return 'ban 처리 되었습니다.';
    return 200;
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
    const blockInfo = await this.usersService.setBlock(
      targetNickname,
      user,
      this.inMemoryUsers,
    );
    client.emit('chat_block', blockInfo);
    return 200;
  }

  // API: MAIN_CHAT_16
  @SubscribeMessage('chat_get_roomList')
  getPublicAndProtectedChannel(@ConnectedSocket() client: Socket) {
    const channels = this.chatService.getPublicAndProtectedChannel();
    client.emit('chat_get_roomList', channels);
    return 200;
  }

  // API: MAIN_CHAT_17
  @SubscribeMessage('chat_get_DMList')
  async getPrivateChannels(@ConnectedSocket() client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string);
    const user: UserObject = this.inMemoryUsers.getUserByIdFromIM(userId);
    const channels = await this.chatService.getPrivateChannels(user);
    client.emit('chat_get_DMList', channels);
    return 200;
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
    console.log(dm);
    client.emit('chat_get_DM', dm);
    return 200;
  }

  // API: MAIN_CHAT_20
  @SubscribeMessage('chat_get_grant')
  async getGrant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    // const { userIdx, channelIdx } = payload;
    const { userIdx, channelIdx } = JSON.parse(payload);
    const user: UserObject = this.inMemoryUsers.getUserByIdFromIM(userIdx);
    const channel = this.chat.getProtectedChannel(channelIdx);
    const grant = this.chatService.getGrant(channel, user);
    client.emit('chat_get_grant', grant);
    return 200;
  }

  @SubscribeMessage('chat_invite_ask')
  async inviteFriendToGame(@MessageBody() invitation: GameInvitationDto) {
    const targetTuple = this.chat.getUserTuple(invitation.targetUserIdx);
    const targetSocket = targetTuple[1];
    const userTuple = this.chat.getUserTuple(invitation.myUserIdx);
    const myObject = userTuple[0];
    if (targetSocket === undefined) {
      return new ReturnMsgDto(400, 'Bad Request, target user is not online');
    }
    // in memory 로 바꿀까?
    const target = this.inMemoryUsers.getUserByIdFromIM(targetTuple[0].userIdx);
    // const target = await this.usersService.getUserInfoFromDBById(
    //   targetTuple[0].userIdx,
    // );
    if (target.isOnline === OnlineStatus.ONGAME) {
      return new ReturnMsgDto(400, 'Bad Request, target user is on Game');
    } else if (target.isOnline === OnlineStatus.ONLINE) {
      const invitaionCard = new GameInvitationAskDto(
        myObject.userIdx,
        myObject.nickname,
      );
      targetSocket.emit('chat_invite_answer', invitaionCard);
    } else {
      return new ReturnMsgDto(400, 'Bad Request, target user is offline');
    }
    return new ReturnMsgDto(200, 'OK!');
  }

  @SubscribeMessage('chat_invite_answer')
  acceptFriendToGame(@MessageBody() answer: GameInvitationAnswerDto) {
    const inviteTuple = this.chat.getUserTuple(answer.inviteUserIdx);
    const targetTuple = this.chat.getUserTuple(answer.targetUserIdx);
    const inviteSocket = inviteTuple[1];
    const targetSocket = targetTuple[1];
    const inviteUser: UserObject = inviteTuple[0];
    const targetUser: UserObject = targetTuple[0];
    const answerCard = new GameInvitationAnswerPassDto(
      inviteUser,
      targetUser,
      answer.answer,
    );
    if (answer.answer === true) {
      // 이건 inmemory 에 저장함
      // targetUser.isOnline = OnlineStatus.ONGAME;
      // inviteUser.isOnline = OnlineStatus.ONGAME;
      //TODO: save 메서드 필요
      this.usersService.setIsOnline(targetUser, OnlineStatus.ONGAME);
      this.usersService.setIsOnline(inviteUser, OnlineStatus.ONGAME);
    }
    inviteSocket.emit('chat_receive_answer', answerCard);
    targetSocket.emit('chat_receive_answer', answerCard);
    return new ReturnMsgDto(200, 'Ok!');
  }
}
