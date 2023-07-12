import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDMDto, FindDMChannelDto } from './dto/chats.dto';

@Controller('chat/')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('dm/:target_nickname')
  createChannelandInitDM(@Param('target_nickname') target_nickname: string, @Body('content') content: string) {

    // const nick = createChatDMDto.target_nickname;
    // const user:User = this.userService.findOne(nick);
    // user.id
    const createChatDMDto = new CreateChatDMDto(0, 0, content);

    return this.chatService.createDMChannel(createChatDMDto, 1); // 1은 대상 id임
  }

  @Get('dm/:target_nickname')
  findDMChannel(@Param('target_nickname') target_nickname: string) {
    // userService findUserByNickname 이 필요하다.
    // 일단 임시로 0, 1로 설정
    const my_user = 0;
    const target_user = 1;
    this.chatService.findDMChannel(0, 1);
    return this.chatService.findDMChannel(my_user, target_user);
  }
  // @Post('dm/:target_nickname')
  // createChannelandInitDM(@Param('target_nickname') target_nickname: string, @Body('content') content: string) {
  //   const createChatDMDto = new CreateChatDMDto(0, 0, content);
  //   return this.chatService.createDMChannel(createChatDMDto, target_nickname);
  // }

  // -----------------------------------------------------
  // @Post()
  // create(@Body() createChatDto: CreateChatDto) {
  //   return this.chatService.create(createChatDto);
  // }


  // @Get()
  // findAll() {
  //   return this.chatService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.chatService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
  //   return this.chatService.update(+id, updateChatDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.chatService.remove(+id);
  // }
}
