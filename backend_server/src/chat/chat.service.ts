import { Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Channel } from './class/channel.class';
import { Chat } from './class/chat.class';

@Injectable()
export class ChatService {
  findChannelByRoomId(roomId: number): Channel {
    // this.chat.getProtectedChannels.find(
    //   (channel) => channel.getRoomId === roomId,
    // );
    return;
  }
}

// create(createChatDto: CreateChatDto) {
//   return 'This action adds a new chat';
// }

// findAll() {
//   return `This action returns all chat`;
// }

// findOne(id: number) {
//   return `This action returns a #${id} chat`;
// }

// update(id: number, updateChatDto: UpdateChatDto) {
//   return `This action updates a #${id} chat`;
// }

// remove(id: number) {
//   return `This action removes a #${id} chat`;
// }
