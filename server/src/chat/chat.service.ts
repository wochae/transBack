import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository, getConnection } from 'typeorm';
import { Channel, ChannelMember, Message } from './chat.entity';
import { CreateChatDMDto, CreateChatDto, FindDMChannelDto, FindDMChannelResDto } from './dto/chats.dto';

@Injectable()
export class ChatService {
  constructor(
    @Inject('MESSAGES_REPOSITORY')
    private messageRepository: Repository<Message>,
    @Inject('CHANNELS_REPOSITORY')
    private channelRepository: Repository<Channel>,
    @Inject('CHANNELMEMBERS_REPOSITORY')
    private channelMemberRepository: Repository<ChannelMember>,
  ) { }

  // async createChannel(createChannelDto: CreateChatDto){}

  // situation 1. DM 채팅방이 없을 때 행위자 user1 channelType 0 is DM
  async createDMChannel(createChatDMDto: CreateChatDMDto, target_user_idx: number) {
    const { userIdx, channelType, message } = createChatDMDto;
    const socketClinetUserId = 0; // 당소. 나중에 client로부터 받아올 예정
    // let targetUser: number; // 귀소, 일단은 지금 유저 정보가 없어서 식별자 number 값으로 대체
    let targetUser = target_user_idx;
    const channelMember = await this.channelMemberRepository.findOne({ 
      where: { userIdx: userIdx, channelType: channelType }
    });
    
    if (channelMember) { // 존재하면 안 돼서 에러를 반환.
      throw new NotFoundException(`ChannelMember with userIdx ${userIdx} already exists`);
    }
    // 채널 생성 먼저
    // 이거 용도, 한 채널을 생성한 뒤에 그 채널에 대한 두 가지의 채널멤버 튜플을 넣어야해서.
    const channelMaxId = await this.channelRepository
      .createQueryBuilder("channel")
      .select('MAX(channel.id)', 'id')
      .getRawOne();
    let idx = 1;
    if (channelMaxId != null) idx = channelMaxId + 1;
    // 이렇게 넣으면 nullalbe 해지나?
    const channel = await this.channelRepository.save({
      channelIdx: idx,
      channelName : "DM",
      channelType: 0,
    });

    const generatedChannelIdx = channel.idx; // 그래서 저 maxId 랑 값이 같아야 함.
    // 채널 멤버 생성
    const channelMember1 = await this.channelMemberRepository.save({
      userIdx: socketClinetUserId,
      channelType: 0,
      channel: channel,
    });
    const channelMember2 = await this.channelMemberRepository.save({
      userIdx: targetUser,
      channelType: 0,
      channel: channel,
    });
    // 지금 멤버가 채널 참조하고 있는데 number 로 통일 하고 싶은데 나중에 어차피 참조할 꺼니깐 잠시 놔 둠.

    // 메시지 생성
    const DM = await this.messageRepository.save({
      channelId: generatedChannelIdx,
      sender: socketClinetUserId, // 내가 대상한테 말하는 상황이라 가정하고 입력
      message: message,
    });

    return { channel, channelMember1, channelMember2, DM };

  };

  async findDMChannel(my_user : number, target_user : number): Promise<FindDMChannelResDto> {
    // my_user 와 target_user 의 idx 가 존재하는
    // 채널 참여자 테이블을 찾는다.(idx는 채널 참여자 테이블의 userIdx)
    const ourChannelId:number = await this.channelMemberRepository
      .createQueryBuilder('cm')
      .where('"userIdx" = :target_user AND "channelType" = 0', { target_user: target_user })
      .getRawOne();
      // TODO : my_user 를 먼저 체크
      // TODO : channelIds 중 map을 사용한 반복문 
      // TODO : channelIdx, 그에 속한 Message객체들 반환, or 없다, 그래서 프론트는 방 생성으로 넘어가는 요청;
      // TODO : DTO 제대로 설계
    // console.log('debug 0:', something[0]);
    // console.log('debug: ', something);
    
    if (ourChannelId == null) {
      throw console.log("DM 채널이 존재하지 않습니다.");
    }

      // TODO : target_user 체크
    console.log(`ourChannelId: ${ourChannelId}`)
    const channelId = await this.channelMemberRepository
      .createQueryBuilder('channel_member')
      .select()
      .where('"userIdx" = :my_user', { my_user: my_user })
      .andWhere('"channelIdx" = :ourChannelId', { ourChannelId: ourChannelId })
      .getRawOne();
    console.log("debug: ", channelId);
    
    // if (channelId == null) {
    //   throw console.log("채널이 존재하지 않습니다.");
    // }
    console.log(`channelId: ${channelId}`);
    console.log('debug: ', channelId.channel.idx);
    // const id = channelId;
    // const query = `
    //   SELECT *
    //   FROM channel_member
    //   WHERE ("userIdx" = $1 AND "channelId" IN (
    //       SELECT "channelId"
    //       FROM "channel_member"
    //       WHERE "userIdx" = $2 AND "channelType" = 0
    //   ))
    // `;
    // const parameters = [my_user, target_user];
    
    // const pair_channelMembers: Promise<ChannelMember[]> = await this.channelMemberRepository.query(query, parameters);
    // if ((await pair_channelMembers).length != 2) {
    //   throw new NotFoundException(`ChannelMember with userIdx ${my_user} and ${target_user} does not exist`);
    // }
    // const chIdx: Promise<ChannelMember[]> = pair_channelMembers;

    // channelId.channel_member_channelIdx
    const foundChannelIdx = channelId.channel.idx;
    console.log('debug: ', foundChannelIdx);
    
    const msgs: Message[] = await this.messageRepository.find({ where: { channelIdx: foundChannelIdx } });
    const findDMChannelResDto: FindDMChannelResDto = new FindDMChannelResDto(foundChannelIdx, msgs);
    return findDMChannelResDto;
  };

  /*
  channelId.channel.idx
  /*
  async findDMChannel(my_user : number, target_user : number) {
    // my_user 와 target_user 의 idx 가 존재하는
    // 채널 참여자 테이블을 찾는다.(idx는 채널 참여자 테이블의 userIdx)
    
    const userRepository = getRepository(User);
    const users = await userRepository.find({ name: 'John' });
    
    return this.channelMemberRepository.query(query, parameters);
  };
  */
  //db logic
  /*
    SELECT *
    FROM channel_member
    WHERE (userId = 'User1' AND channelId IN (
            SELECT channelId
            FROM channel_member
            WHERE userId = 'User2' AND channelType = 0
        ))
        OR (userId = 'User2' AND channelId IN (
            SELECT channelId
            FROM channel_member
            WHERE userId = 'User1' AND channelType = 0
        ));
*/

};

  // 예시
  // createBoard(createBoardDto: CreateBoardDto, user: User): Promise<Board> {
  //   return this.boardRepository.createBoard(createBoardDto, user);
  // }

  // createChannelandInitDM(createChatDMDto:CreateChatDMDto, target_nickname: string, content: string) {
  //   // 임의 ID 정수 값 넣기
  //   // channelRepository.find({ where: { userNick = target_nickname } })
  //   const { channelIdx, userIdx, channelType } = createChatDMDto;
  //   // const { channelName, owner, password } = anythingDto(target_nickname, owner, password);
  //   this.channelRepository.createChannel({ // 주입의 문제 있음.
  //       channelName: target_nickname,
  //       owner: userIdx,
  //       password: null,
  //   });
  //   this.channelMemberRepository.createChannelMember(
  //    );
  //   this.messageRepository.createMessage();
  //   // return 
  // }

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
