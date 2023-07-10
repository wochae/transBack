import { Injectable } from '@nestjs/common';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Channel, ChannelMember, Message } from './chat.entity';
import { ChannelMemberRepository } from './chat.repository';
import { ChannelRepository } from './chat.repository';
import { MessageRepository } from './chat.repository';
import { CreateChatDMDto } from './dto/create-room-dm.dto';

@Injectable()
export class ChatService {
  // constructor(
  //   @InjectRepository(BoardRepository)
  //   private boardRepository: BoardRepository,
  // ) {}
  constructor(
    @InjectRepository(ChannelMemberRepository)
    private channelMemberRepository: ChannelMemberRepository,
    @InjectRepository(ChannelRepository)
    private channelRepository: ChannelRepository,
    @InjectRepository(MessageRepository)
    private messageRepository: MessageRepository,
  ) { }
  // 예시
  // createBoard(createBoardDto: CreateBoardDto, user: User): Promise<Board> {
  //   return this.boardRepository.createBoard(createBoardDto, user);
  // }

  createChannelandInitDM(createChatDMDto:CreateChatDMDto, target_nickname: string, content: string) {
    // 임의 ID 정수 값 넣기
    // channelRepository.find({ where: { userNick = target_nickname } })
    const { channelIdx, userIdx, channelType } = createChatDMDto;
    // const { channelName, owner, password } = anythingDto(target_nickname, owner, password);
    this.channelRepository.createChannel({ // 주입의 문제 있음.
        channelName: target_nickname,
        owner: userIdx,
        password: null,
    });
    this.channelMemberRepository.createChannelMember(
     );
    this.messageRepository.createMessage();
    // return 
  }

  // ------------------------------------------------------
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
}
