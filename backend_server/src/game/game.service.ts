import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { UserObjectRepository } from 'src/users/users.repository';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';
import { GamePlayer } from './class/game.player/game.player';
import { GameOptionDto } from './dto/game.option.dto';
import { OnlineStatus } from 'src/entity/users.entity';
import { GameType, RecordResult, RecordType } from './enum/game.type.enum';
import { GameQueue } from './class/game.queue/game.queue';
import { GameRoom } from './class/game.room/game.room';
import { Socket, Server } from 'socket.io';
import { GameChannel } from 'src/entity/gameChannel.entity';
import { GameRecord } from 'src/entity/gameRecord.entity';
import { GameQueueSuccessDto } from './dto/game.queue.suceess.dto';

@Injectable()
export class GameService {
  private playRoom: GameRoom[];
  private normalQueue: GameQueue;
  private rankQueue: GameQueue;
  private friendQueue: GameQueue;
  private onLinePlayer: [GamePlayer, GameType][];
  private nameCnt: number;
  private today: string;

  constructor(
    private gameRecordRepository: GameRecordRepository,
    private gameChannelRepository: GameChannelRepository,
    private readonly userService: UsersService,
    private readonly inMemoryUsers: InMemoryUsers,
  ) {
    this.playRoom = [];
    this.normalQueue = new GameQueue();
    this.rankQueue = new GameQueue();
    this.friendQueue = new GameQueue();
    this.onLinePlayer = [];
    this.nameCnt = 0;
    const currentData = new Date();
    const year = currentData.getFullYear();
    const month = currentData.getMonth() + 1;
    const day = currentData.getDate();
    const formattedDate = `${year}-${month}-${day}`;
    this.today = formattedDate;
  }

  // PROFILE_INFINITY
  async getGameRecordsByInfinity(userIdx: number, page: number) {
    const skip = page * 3; // items per page fixed
    const records = await this.gameRecordRepository.find({
      where: { userIdx },
      order: { matchDate: 'DESC' },
      skip,
      take: 3,
    });

    return records;
  }

  async makePlayer(data: GameOptionDto): Promise<GamePlayer | null> {
    const target = this.inMemoryUsers.getUserByIdFromIM(data.userIdx);
    if (target === undefined) return null;

    const player = new GamePlayer(target);
    player.setOptions(data);
    if (target.isOnline === OnlineStatus.ONLINE)
      target.isOnline = OnlineStatus.ONGAME;
    this.inMemoryUsers.saveUserByUdFromIM(target.userIdx);
    return player;
  }

  putInQueue(player: GamePlayer) {
    const type = player.getOption().gameType;
    let targetQueue;
    switch (type) {
      case GameType.FRIEND:
        targetQueue = this.friendQueue;
        break;
      case GameType.NORMAL:
        targetQueue = this.normalQueue;
        break;
      case GameType.RANK:
        targetQueue = this.rankQueue;
        break;
    }
    targetQueue.pushPlayer(player);
    this.onLinePlayer.push([player, player.getOption().gameType]);
  }

  setSocketToPlayer(clientSocket: Socket, userIdx: number): boolean {
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        member[0].setSocket(clientSocket);
        return true;
      }
    }
    return false;
  }

  checkQueue(userIdx: number): GamePlayer[] | boolean {
    let target: [GamePlayer, GameType];
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        target = member;
        break;
      }
    }
    const type = target[1];
    let targetQueue: GameQueue;
    switch (type) {
      case GameType.FRIEND:
        targetQueue = this.friendQueue;
        break;
      case GameType.NORMAL:
        targetQueue = this.normalQueue;
        break;
      case GameType.RANK:
        targetQueue = this.rankQueue;
        break;
    }
    if (targetQueue.getLength() >= 2) {
      const list = targetQueue.popPlayer(target[0].getUserObject().userIdx);
      return list;
    } else return false;
  }

  async changeStatusForPlayer(userIdx: number) {
    let target: [GamePlayer, GameType];
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        target = member;
        break;
      }
    }
    if (target === undefined) return;
    target[0].getUserObject().isOnline = OnlineStatus.ONGAME;
    await this.inMemoryUsers.saveUserByUdFromIM(userIdx);
  }

  async makePlayerRoom(players: GamePlayer[], server: Server) {
    const roomName = this.makeRoomName();
    const option = this.setOptions(players);
    const channel = this.makeGameChennl(players);
    await this.gameRecordRepository.save(channel);
    const gameRecord = this.makeGameHistory(players, channel);
    await this.gameRecordRepository.save(gameRecord[0]).then(async () => {
      await this.gameRecordRepository.save(gameRecord[1]);
    });
    const room = new GameRoom(roomName, players, option, gameRecord, channel);
    this.playRoom.push(room);
    players[0].getSocket().join(roomName);
    players[1].getSocket().join(roomName);
    server
      .to(roomName)
      .emit(
        'game_queue_succes',
        new GameQueueSuccessDto(channel.gameIdx, players),
      );
  }

  private makeRoomName(): string {
    const ret = `room_${this.today}_${this.nameCnt++}`;
    return ret;
  }

  private setOptions(players: GamePlayer[]): GameOptionDto {
    const randomInt = this.getRandomInt(1, 2) - 1;
    return players[randomInt].getOption();
  }

  private getRandomInt(min: number, max: number): number {
    let randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randomValue == 0) randomValue = 1;
    return randomValue;
  }

  private makeGameChennl(players: GamePlayer[]): GameChannel {
    let type;
    if (players[0].getOption().gameType === GameType.RANK)
      type = RecordType.RANK;
    else type = RecordType.NORMAL;
    const ret = this.gameChannelRepository.create({
      type: type,
      userIdx1: players[0].getUserObject().userIdx,
      userIdx2: players[1].getUserObject().userIdx,
      score1: 0,
      score2: 0,
      status: RecordResult.DEFAULT,
    });
    return ret;
  }

  private makeGameHistory(
    players: GamePlayer[],
    channel: GameChannel,
  ): GameRecord[] {
    const player1 = players[0].getUserObject();
    const player2 = players[1].getUserObject();
    const history1 = this.gameRecordRepository.create({
      gameIdx: channel.gameIdx,
      userIdx: player1.userIdx,
      matchUserNickname: player2.nickname,
      matchUserIdx: player2.userIdx,
      type: channel.type,
      result: channel.status,
      score: '',
    });
    const history2 = this.gameRecordRepository.create({
      gameIdx: channel.gameIdx,
      userIdx: player2.userIdx,
      matchUserNickname: player1.nickname,
      matchUserIdx: player1.userIdx,
      type: channel.type,
      result: channel.status,
      score: '',
    });
    const histories: GameRecord[] = [];
    histories.push(history1);
    histories.push(history2);
    return histories;
  }

  checkReady(userIdx: number): boolean | null {
    const room = this.findGameRoomById(userIdx);
    if (room === null) return null;
    room.users[0].setReady(userIdx);
    room.users[1].setReady(userIdx);
    return room.users[0].getReady() && room.users[1].getReady();
  }

  private findGameRoomById(userIdx: number): GameRoom | null {
    for (const room of this.playRoom) {
      if (room.users[0].getUserObject().userIdx === userIdx) {
        return room;
      } else if (room.users[1].getUserObject().userIdx === userIdx) {
        return room;
      }
    }
    return null;
  }
}
