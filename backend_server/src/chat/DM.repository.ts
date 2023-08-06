import { Repository } from 'typeorm'; // EntityRepository 가 deprecated 되어 직접 호출함
import { CustomRepository } from 'src/typeorm-ex.decorator';
import { DMChannel, DirectMessage } from './entities/chat.entity';
import { SendDMDto } from './dto/send-dm.dto';
import { UserObject } from 'src/users/entities/users.entity';
import { first } from 'rxjs';

@CustomRepository(DMChannel)
export class DMChannelRepository extends Repository<DMChannel> {
  async createChannel(
    client: UserObject,
    target: UserObject,
    channelIdx: number,
  ): Promise<DMChannel[]> {
    let list;
    const channel1 = await this.create({
      userIdx1: client.userIdx,
      userIdx2: target.userIdx,
      userNickname1: client.nickname,
      userNickname2: target.nickname,
      channelIdx: channelIdx,
      user1: client,
      user2: target,
    });

    const channel2 = await this.create({
      userIdx1: target.userIdx,
      userIdx2: client.userIdx,
      userNickname1: target.nickname,
      userNickname2: client.nickname,
      channelIdx: channelIdx,
      user1: target,
      user2: client,
    });
    list.push(channel1);
    list.push(channel2);

    return list;
  }
}

@CustomRepository(DirectMessage)
export class DirectMessageRepository extends Repository<DirectMessage> {
  async sendDm(
    sendDm: SendDMDto,
    user: UserObject,
    channelIdx: number,
  ): Promise<DirectMessage> {
    const { msg } = sendDm;

    const firstDM = await this.create({
      channelIdx: channelIdx,
      sender: user.nickname,
      msg: msg,
      msgDate: new Date(),
    });

    return firstDM;
  }
}
