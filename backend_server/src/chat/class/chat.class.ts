import { Channel } from './channel.class';

export class Chat {
  private protectedChannels: Channel[];
  private privateChannels: Channel[];

  constructor() {
    this.protectedChannels = [];
    this.privateChannels = [];
  }
}
