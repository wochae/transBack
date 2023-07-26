import { Injectable, Logger } from '@nestjs/common';
import { Channel } from './class/channel.class';
import { Chat } from './class/chat.class';
import { Socket } from 'socket.io';
import { error } from 'console';

@Injectable()
export class ChatService {
  constructor(private chat: Chat) {}
  private logger: Logger = new Logger('ChatService');

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
    channel.setMember = [clientData.nickname];
    // 인메모리에 넣는 곳이 필요함
    // 채널을 찾아야한다. 그리고 넣어야한다.
    // API: MAIN_CHAT_3
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

  /********************* check Room Member & client *********************/
  checkAlreadyInRoom(clientData: any): boolean {
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
}
