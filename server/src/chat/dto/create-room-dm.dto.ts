import { IsNotEmpty } from 'class-validator';

export class CreateChatDMDto{
    // constructor(channelIdx: number, userIdx: number, channelType: number) {
    //     this.channelIdx = channelIdx;
    //     this.userIdx = userIdx;
    //     this.channelType = channelType;
    // }
    @IsNotEmpty()
    channelIdx: number;

    @IsNotEmpty()
    userIdx: number;
    
    @IsNotEmpty()
    channelType: number;
}


// import { IsNotEmpty } from 'class-validator';

// export class CreateBoardDto {
//   @IsNotEmpty()
//   title: string;

//   @IsNotEmpty()
//   description: string;
// }
