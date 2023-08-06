import { Channel } from '../class/channel.class';

export class chatGetProfileDto {
  constructor(
    targetNickname: string,
    img: string,
    rate: number,
    historics: string[],
    isOnline: boolean,
  ) {
    this.targetNickname = targetNickname;
    this.img = img;
    this.rate = rate;
    this.historics = historics;
    this.isOnline = isOnline;
  }

  targetNickname: string;
  img: string;
  rate: number;
  historics: string[]; // Game obj
  isOnline: boolean;
}

export class chatCreateRoomReqDto {
  constructor(password: string, type: string) {
    this.nickname = 'wochae';
    this.password = password;
    this.type = type;
  }
  nickname: string;

  password: string;
  type: string;
}

export class chatCreateRoomResDto {
  constructor(member: string, channelIdx: number, password: boolean) {
    this.member = [member];
    this.channelIdx = channelIdx;
    this.password = password;
  }
  member: string[];
  channelIdx: number;
  password: boolean;
}
