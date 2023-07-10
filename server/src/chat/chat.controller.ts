import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';

@Controller('chat/')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // @Post('dm/:target_nickname')
  // createChannelandInitDM(@Param('target_nickname') target_nickname: string, @Body('content') content: string) {
    
  //   return this.chatService.createChannelandInitDM(target_nickname, content);
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
