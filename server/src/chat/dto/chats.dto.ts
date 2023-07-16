import { IsNotEmpty } from 'class-validator';
import { Message } from '../chat.entity';

export class CreateChatDMReqDto{
    constructor(userIdx: number, channelType: number, message: string) {
        this.userIdx = userIdx;
        this.channelType = channelType;
        this.message = message;
    }

    // 주석한 이유 : 새로 생성할 건데 어떻게 channelIdx가 존재?
    // @IsNotEmpty()
    // channelIdx: number;

    @IsNotEmpty()
    userIdx: number;
    
    // 주석 처리 한 이유 : 어차피 DM 생성하는 거라면 dto에 넣을 필요 없이 서버 단에서 DB에 0을 넣어주면 됨.
    // 주석 해제 한 이유 : DM이 존재할 수도 있어서 쉽게 찾으려고.
    @IsNotEmpty()
    channelType: number;

    @IsNotEmpty()
    message: string;
}

export class CreateChatDMResDto {
    constructor(channelIdx: number, messages: Message[]) {
        this.channelIdx = channelIdx;
        this.messages = messages;
    }

    channelIdx: number;
    messages: Message[];
}

export class CreateChatDto{
    userIdx: number;
    channelType: number;
}

export class FindDMChannelDto{
    @IsNotEmpty()
    my_nickname: string;
    
    @IsNotEmpty()
    target_nickname : string;
}

// export class FindDMChannelResDto {
//     constructor(my_userIdx: number, target_userIdx: number, msgs: Message[]) {
//         this.my_userIdx = my_userIdx;
//         this.target_userIdx = target_userIdx;
//         this.msgs = msgs;
//     }
//     my_userIdx: number;
//     target_userIdx: number;
//     msgs : Message[];
// }
export class FindDMChannelResDto {
    constructor(channelIdx :number, msgs: Message[]) {
        this.channelIdx = channelIdx;
        this.msgs = msgs;
    }
    channelIdx: number;
    msgs : Message[];
}