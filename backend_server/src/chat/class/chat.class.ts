import { Channel } from './channel.class';

export class Chat {
  /* 채널 목록 */
  private protectedChannels: Channel[];
  private privateChannels: Channel[];

  constructor() {
    this.protectedChannels = [];
    this.privateChannels = [];
  }
}
