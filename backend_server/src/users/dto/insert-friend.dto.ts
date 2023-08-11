import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { FriendList } from '../../entity/friendList.entity';

export class InsertFriendReqDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(1)
  @Matches(/^[a-zA-Z0-9]*$/, { message: 'intra is unique' })
  targetNickname: string;
  targetIdx : number;
}

export class InsertFriendDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(1)
  @Matches(/^[a-zA-Z0-9]*$/, { message: 'intra is unique' })
  targetNickname: string;
}


export class InsertFriendResDto {
  friendList: FriendList[]; // 이거 하나의 객체인데 왜 이름이 리스트 ㅋㅋ
}

export class FriendDto {
  frindNickname : string;
  friendIdx : number;
  isOnline : boolean;
}