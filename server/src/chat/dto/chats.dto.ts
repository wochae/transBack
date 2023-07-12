import { IsNotEmpty } from 'class-validator';
import { Message } from '../chat.entity';

// 한 클레스에서 여러 개의 dto를 만들 수 있음.

export class CreateChatTargetDto{
    @IsNotEmpty()
    target_nickname: string;

    @IsNotEmpty()
    content: string;
}

export class CreateChatDMDto{
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

    // 근데 우리 비밀번호 컬럼 데이터에 저장할 때 비밀번호 암호화 처리해야함.
}

export class CreateChatDto{
    userIdx: number;
    channelType: number;
}



// import { IsNotEmpty } from 'class-validator';

// export class CreateBoardDto {
//   @IsNotEmpty()
//   title: string;

//   @IsNotEmpty()
//   description: string;
// }
