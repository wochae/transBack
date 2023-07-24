import { Channel } from './channel.class';

export class Chat {
  /******************************* 변수 *******************************/
  private protectedChannels: Channel[];
  private privateChannels: Channel[];
  static idxForSetChannelIdx = 0;

  /******************************* 메서드 *******************************/
  constructor() {
    this.protectedChannels = [];
    this.privateChannels = [];
  }

  // getter
  get getProtectedChannels(): Channel[] {
    return this.protectedChannels;
  }
  get getPrivateChannels(): Channel[] {
    return this.privateChannels;
  }

  // setter
  set setProtectedChannels(protectedChannel: Channel) {
    this.protectedChannels.push(protectedChannel);
  }
  set setPrivateChannels(privateChannel: Channel) {
    this.privateChannels.push(privateChannel);
  }

  // method
  // FIXME: 여기서는 protected 와 private 을 한번에 처리. channelIdx 으로 삭제하기 때문에.
  removeChannel(channelIdx: number): void {
    const protectedChannelIdx = this.protectedChannels.findIndex(
      (channel) => channel.getChannelIdx === channelIdx,
    );
    // splice 는 원본을 수정한다. 실패 시 빈배열을 반환한다고 한다. 따로 에러처리가 필요없다고 생각했다.
    if (protectedChannelIdx !== -1) {
      this.protectedChannels.splice(protectedChannelIdx, 1);
    }

    const privateChannelIdx = this.privateChannels.findIndex(
      (channel) => channel.getChannelIdx === channelIdx,
    );
    if (privateChannelIdx !== -1) {
      this.privateChannels.splice(privateChannelIdx, 1);
    }
  }
}
