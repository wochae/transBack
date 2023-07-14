import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDMDto, FindDMChannelDto, FindDMChannelResDto } from './dto/chats.dto';
import { UsersService } from 'src/users/users.service';

@Controller('chat/')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @Post('dm/:target_nickname')
  createChannelandInitDM(@Param('target_nickname') target_nickname: string, @Body('content') content: string) {

    // const nick = createChatDMDto.target_nickname;
    // const user:User = this.userService.findOne(nick);
    // user.id
    const createChatDMDto = new CreateChatDMDto(0, 0, content);

    return this.chatService.createDMChannel(createChatDMDto, 1); // 1은 대상 id임
  }

  @Get('dm/:target_nickname')
  async findDMChannel(@Param('target_nickname') target_nickname: string){
    // 일단 임시로 1은 나임을 알림,
    const my_user = "jujeon"; // temporary variable, my_user_idx
    const my_user_idx = await this.usersService.findUserIdxByNickname(my_user); // my_user_idx
    const target_userIdx = await this.usersService.findUserIdxByNickname(target_nickname); // target_user_idx
    
    // console.log('controller debug: ', value);
    
    return await this.chatService.findDMChannel(my_user_idx, target_userIdx); // parmas types are number
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
