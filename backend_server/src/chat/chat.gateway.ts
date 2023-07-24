import { WebSocketGateway, SubscribeMessage, MessageBody,ConnectedSocket,WebSocketServer } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ namespace: 'chat'})
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}
  @WebSocketServer()
  server: Server;


  @SubscribeMessage('user_profile')
  async handleGetProfile(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string) {
    // const targetProfile = await this.chatService.getProfile(targetNickname);
    // client.emit('target_profile', targetProfile);
  }

  @SubscribeMessage('check_dm')
  async handleCheckDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() targetNickname: string) {
    // if (!this.chatService.checkDM(targetNickname)) {
    //   client.emit('not_found_dm'); // 여기서 찾을 수 없다는 메시지를 받으면 그 둘의 관련된 channel 페이지로 이동시킨다.
    // } else { const { Message[], member[], channelIdx } = await this.chatService.getDM(targetNickname);
    // client.emit('found_dm', { Message[], member[], channelIdx });
    // }
  }
  
  @SubscribeMessage('createChat')
  create(@MessageBody() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto);
  }

  @SubscribeMessage('findAllChat')
  findAll() {
    return this.chatService.findAll();
  }

  @SubscribeMessage('findOneChat')
  findOne(@MessageBody() id: number) {
    return this.chatService.findOne(id);
  }

  @SubscribeMessage('updateChat')
  update(@MessageBody() updateChatDto: UpdateChatDto) {
    return this.chatService.update(updateChatDto.id, updateChatDto);
  }

  @SubscribeMessage('removeChat')
  remove(@MessageBody() id: number) {
    return this.chatService.remove(id);
  }


}
