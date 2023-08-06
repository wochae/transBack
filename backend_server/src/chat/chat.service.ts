import { Injectable, Logger } from '@nestjs/common';
import { Channel } from './class/channel.class';
import { Chat, MessageInfo, MessageInteface } from './class/chat.class';
import { DataSource, EntityManager, Transaction } from 'typeorm';
import { UserObject } from 'src/users/entities/users.entity';
import { DMChannel, DirectMessage, Mode } from './entities/chat.entity';
import { DMChannelRepository, DirectMessageRepository } from './DM.repository';
import { SendDMDto } from './dto/send-dm.dto';
import { InMemoryUsers } from 'src/users/users.provider';
import { Socket } from 'socket.io';

@Injectable()
export class ChatService {
  constructor(
    private chat: Chat,
    private dataSource: DataSource,
    private dmChannelRepository: DMChannelRepository,
    private directMessagesRepository: DirectMessageRepository,
    // TODO: gateway에서도 InmemoryUsers 를 사용하는데, service 로 옮기자
    private inmemoryDB: InMemoryUsers,
  ) {}
  private logger: Logger = new Logger('ChatService');

  /********************* check Room Member & client *********************/
  checkAlreadyInRoom(clientData: any) {
    // find() 사용
    const channel = this.findChannelByRoomId(clientData.roomId);
    // if (channel == null) {
    //   return false;
    // }
    return channel.getMember.flat().find((member) => {
      return member === clientData.nickname;
    });
    // Set 사용
    // const channel = this.findChannelByRoomId(clientData.roomId);
    // const membersSet = new Set(channel.getMember.flat());
    // console.log(membersSet);
    // return membersSet.has(clientData.nickname);
  }

  /***************************** Find Channel *****************************/
  // TODO: 아래 세가지 함수로 하나로 합치는게 좋을까? 논의 필요
  // 합치게 되면, 반환되는 채널이 어떤 채널인지 구분할 수 있는 방법이 필요함.
  findChannelByRoomId(roomId: number): Channel {
    this.logger.log(
      `[ 💬 Socket API ] findChannelByRoomId _ roomId: ${roomId}`,
    );
    const protectedChannel: Channel = this.chat.getProtectedChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    return protectedChannel || null;
  }

  findProtectedChannelByRoomId(roomId: number): Channel {
    this.logger.log(
      `[ 💬 Socket API ] findChannelByRoomId _ roomId: ${roomId}`,
    );
    const protectedChannel: Channel = this.chat.getProtectedChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    if (protectedChannel == undefined || protectedChannel.getPassword == null) {
      return null;
    }
    return protectedChannel;
  }

  findPublicChannelByRoomId(roomId: number): Channel {
    this.logger.log(
      `[ 💬 Socket API ] findChannelByRoomId _ roomId: ${roomId}`,
    );
    const publicChannel: Channel = this.chat.getProtectedChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    if (publicChannel == undefined || publicChannel.getPassword != null) {
      return null;
    }
    return publicChannel;
  }

  findPrivateChannelByRoomId(roomId: number): Channel {
    this.logger.log(
      `[ 💬 Socket API ] findChannelByRoomId _ roomId: ${roomId}`,
    );
    // DB 에서 찾아야함
    // const privateChannel = this.chat.getPrivateChannels.find(
    //   (channel) => channel.getRoomId === roomId,
    // );
    // if (privateChannel == undefined) {
    //   return null;
    // }
    // return privateChannel;
    return null;
  }

  async createDmChannel(
    client: UserObject,
    target: UserObject,
    channelIdx: number,
    msg: SendDMDto,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();
    let ret = true;
    const list = await this.dmChannelRepository.createChannel(
      client,
      target,
      channelIdx,
    );
    const firstDM = await this.directMessagesRepository.sendDm(
      msg,
      client,
      channelIdx,
    );
    console.log(firstDM);
    await this.directMessagesRepository.save(firstDM);

    try {
      await queryRunner.manager.save(list[0]);
      await queryRunner.manager.save(list[1]);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      ret = false;
    } finally {
      await queryRunner.release();
    }
    return ret;
  }

  // FIXME: 반환값...
  async checkDM(
    userIdx: number,
    targetIdx: number,
  ): Promise<MessageInfo | boolean> {
    const dmChannel: DMChannel = await this.dmChannelRepository.findDMChannel(
      userIdx,
      targetIdx,
    );
    if (!dmChannel) {
      console.log('채널이 없습니다.');
      return false;
    }
    const dmMessageList = await Promise.all(
      (
        await this.directMessagesRepository.findMessageList(
          dmChannel.channelIdx,
        )
      ).map(async (dm) => {
        return {
          sender: dm.sender,
          msg: dm.msg,
        };
      }),
    );
    const messageInfo: MessageInfo = {
      message: dmMessageList,
      userIdx1: dmChannel.userIdx1,
      userIdx2: dmChannel.userIdx2,
      userNickname1: dmChannel.userNickname1,
      userNickname2: dmChannel.userNickname2,
      channelIdx: dmChannel.channelIdx,
    };
    return messageInfo;
  }

  async createDM(
    client: Socket,
    user: UserObject,
    targetUser: UserObject,
    msg: SendDMDto,
  ) {
    const channelIdx = await this.setNewChannelIdx();
    // await this.createDmChannel(user, targetUser, channelIdx, msg);
    await this.dmChannelRepository.createChannel(user, targetUser, channelIdx);
    await this.directMessagesRepository.sendDm(msg, user, channelIdx);
    // const firstDM = await this.directMessagesRepository.sendDm(
    //   msg,
    //   user,
    //   channelIdx,
    // );
    const message: MessageInteface = {
      sender: user.nickname,
      msg: msg.msg,
    };
    const dmInfo = {
      message: message,
      channelIdx: channelIdx,
    };
    // 상대방 소켓 찾아서 join 시키기
    const targetSocket = this.chat.getSocketObject(targetUser.userIdx);
    if (!targetSocket) {
      console.log('상대방이 오프라인입니다.');
      return;
    }
    targetSocket.socket.join(`chat_room_${channelIdx}`);
    client.join(`chat_room_${channelIdx}`);
    return dmInfo;
  }

  async setNewChannelIdx(): Promise<number> {
    const maxChannelIdxInIM = await this.chat.getMaxChannelIdxInIM();
    const maxChannelIdxInDB =
      await this.dmChannelRepository.getMaxChannelIdxInDB();
    // FIXME: chat 클래스에 있는 정적 변수는 지워도 되지 않을까?
    const channelIdx = Math.max(maxChannelIdxInIM, maxChannelIdxInDB) + 1;
    return channelIdx;
  }
}
