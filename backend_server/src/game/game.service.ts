import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { GameRoom } from './class/game.room/game.room';
import { GameWaitQueue } from './class/game.wait.queue/game.wait.queue';
import { GameQueue } from './class/game.queue/game.queue';
import { GameOnlineMember } from './class/game.online.member/game.online.member';
import { UserObjectRepository } from 'src/users/users.repository';

@Injectable()
export class GameService {
  private playRoomList: GameRoom[];
  private normalQueue: GameQueue;
  private rankQueue: GameQueue;
  //   private waitingList: GameWaitQueue[];
  private onlinePlayerList: GameOnlineMember[];

  constructor(
    private gameRecordRepository: GameRecordRepository,
    private gameChannelRepository: GameChannelRepository,
    private userObjectRepository: UserObjectRepository,
  ) {
    this.playRoomList = [];
    this.onlinePlayerList = [];
  }

  private findPlayerFromList(userIdx: number): number {
    let index = 0;
    for (index = 0; index < this.onlinePlayerList.length; index++) {
      if (this.onlinePlayerList[index].user.userIdx == userIdx) return index;
    }

    return 999;
  }

  public makeRoomId(): string {
    const ret = 'room';
    return ret.concat(this.playRoomList.length.toString());
  }

  public async pushOnlineUser(player: GameOnlineMember): Promise<number> {
    const index = this.findPlayerFromList(player.user.userIdx);

    if (index !== 999) return 999;

    if (player.user.isOnline == false) player.user.isOnline = true;
    await this.userObjectRepository.save(player.user);
    this.onlinePlayerList.push(player);
    return this.onlinePlayerList.length;
  }

  public async popOnlineUser(userIdx: number): Promise<number> {
    const index = this.findPlayerFromList(userIdx);

    if (index == 999) return this.onlinePlayerList.length;

    this.onlinePlayerList[index].user.isOnline = false;
    await this.userObjectRepository.save(this.onlinePlayerList[index].user);
    this.onlinePlayerList.splice(index);

    return this.onlinePlayerList.length;
  }

  // TODO: 연결 종료 시 online 리스트에서 빼야함.
}
