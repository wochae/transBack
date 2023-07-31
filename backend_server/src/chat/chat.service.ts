import { Injectable, Logger } from '@nestjs/common';
import { Channel } from './class/channel.class';
import { Chat } from './class/chat.class';
import { Socket } from 'socket.io';
import { error } from 'console';
import { DataSource } from 'typeorm';
import { UserObject } from 'src/users/entities/users.entity';
import { DMChannel, DirectMessage } from './entities/chat.entity';
import { DMChannelRepository, DirectMessageRepository } from './DM.repository';
import { SendDMDto } from './dto/send-dm.dto';

@Injectable()
export class ChatService {
  constructor(
    private chat: Chat,
    private dataSource: DataSource,
    private dmChannelRepository: DMChannelRepository,
    private directMessagesRepository: DirectMessageRepository,
  ) {}
  private logger: Logger = new Logger('ChatService');

  /***************************** Find Channel *****************************/
  // TODO: { member[], channelIdx } 이 두개를 반환할건데... 어떻게 해야할까?
  // TODO: 에러처리 catch ~ throw
  enterChatRoom(client: Socket, clientData: any, channel: Channel): any {
    // // 2. 비밀번호 확인
    // if (channel != null) {
    //   if (channel.getPassword !== clientData.password) {
    //     client.emit('wrong_password');
    //     this.logger.log(`[ 💬 Socket API ] 'chat_enter _ Wrong_password`);
    //     return new error('wrong_password');
    //   }
    // }
    this.logger.log(
      `[ 💬 Socket API ] enterChatRomm _ roomId: ${channel.getRoomId}`,
    );
    client.join(`Room${channel.getRoomId.toString()}`);
    channel.setMember = clientData.nickname;
    // 인메모리에 넣는 곳이 필요함
    // 채널을 찾아야한다. 그리고 넣어야한다.
    // client.emit('enter_chat_room', {
    //   member: channel.getMember,
    //   channelIdx: channel.getChannelIdx,
    // });
    // API: MAIN_CHAT_6.1
    client
      .to(`Room${channel.getRoomId.toString()}`)
      .emit('chat_enter_noti', clientData.nickname);
    this.logger.log(
      `[ 💬 Socket API ] ${clientData.nickname} Success enterChatRomm _ roomId: ${channel.getRoomId}`,
    );
    return {
      member: channel.getMember,
      channelIdx: channel.getChannelIdx,
    };
  }

  // TODO: 아래 세가지 함수로 하나로 합치는게 좋을까? 논의 필요
  // 합치게 되면, 반환되는 채널이 어떤 채널인지 구분할 수 있는 방법이 필요함.
  findChannelByRoomId(roomId: number): Channel {
    this.logger.log(
      `[ 💬 Socket API ] findChannelByRoomId _ roomId: ${roomId}`,
    );
    const protectedChannel: Channel = this.chat.getProtectedChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    const privateChannel: Channel = this.chat.getPrivateChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    return protectedChannel || privateChannel || null;
  }

  findProtectedChannelByRoomId(roomId: number): Channel {
    this.logger.log(
      `[ 💬 Socket API ] findChannelByRoomId _ roomId: ${roomId}`,
    );
    const protectedChannel: Channel = this.chat.getProtectedChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    // protectedChannel 은 Public 과 Protected 둘 다 있을 수 있음.
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
    const privateChannel = this.chat.getPrivateChannels.find(
      (channel) => channel.getRoomId === roomId,
    );
    if (privateChannel == undefined) {
      return null;
    }
    return privateChannel;
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
}
