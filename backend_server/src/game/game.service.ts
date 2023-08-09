import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { GameRoom } from './class/game.room/game.room';
import { GameWaitQueue } from './class/game.wait.queue/game.wait.queue';
import { GameQueue } from './class/game.queue/game.queue';
import { GameOnlineMember } from './class/game.online.member/game.online.member';
import { UserObjectRepository } from 'src/users/users.repository';
import { GamePlayer } from './class/game.player/game.player';
import { GameOptions } from './class/game.options/game.options';
import { GameType, GameSpeed, MapNumber } from './enum/game.type.enum';
import { RecordType, RecordResult } from 'src/entity/gameChannel.entity';
import { GameSmallOptionDto } from './dto/game.options.small.dto';
import { Socket, Server } from 'socket.io';

type WaitPlayerTuple = [GamePlayer, GameOptions];

@Injectable()
export class GameService {
  private playRoomList: GameRoom[];
  private normalQueue: GameQueue;
  private rankQueue: GameQueue;
  private waitingList: GameWaitQueue;
  private onlinePlayerList: GameOnlineMember[];
  private cnt: number;

  constructor(
    private gameRecordRepository: GameRecordRepository,
    private gameChannelRepository: GameChannelRepository,
    private userObjectRepository: UserObjectRepository,
  ) {
    this.playRoomList = [];
    this.onlinePlayerList = [];
    this.waitingList = new GameWaitQueue();
    this.normalQueue = new GameQueue();
    this.rankQueue = new GameQueue();
    this.cnt = 0;
  }

  private findPlayerFromList(userIdx: number): number {
    let index = 0;
    for (index = 0; index < this.onlinePlayerList.length; index++) {
      if (this.onlinePlayerList[index].user.userIdx == userIdx) return index;
    }

    return 999;
  }

  private makeGamePlayer(userIdx: number): GamePlayer {
    const user = this.onlinePlayerList[this.findPlayerFromList(userIdx)];
    const player: GamePlayer = new GamePlayer(
      userIdx,
      user.user,
      user.userSocket,
    );
    return player;
  }

  public makeRoomId(): string {
    const target = 'game_room'.concat(this.cnt.toString());
    this.cnt++;
    return target;
  }

  public sizeWaitPlayer(): number {
    return this.waitingList.size();
  }

  public putInQueue(userIdx: number): number {
    const playerTuple: WaitPlayerTuple = this.waitingList.popPlayer(userIdx);
    switch (playerTuple[1].getType()) {
      case GameType.FRIEND:
        return 999;
      case GameType.NORMAL:
        this.normalQueue.Enqueue(playerTuple);
        if (this.normalQueue.size() >= 2) {
          const playerList: WaitPlayerTuple[] | null =
            this.normalQueue.DequeueList();
          if (playerList === null) return 0;
          const roomId = this.makeRoomId();
          const gameRoom = new GameRoom(roomId);
          gameRoom.setUser(playerList[0][0], playerList[0][1]);
          gameRoom.setUser(playerList[1][0], playerList[2][1]);
          return this.playRoomList.push(gameRoom);
        }
        return 999;
      case GameType.RANK:
        this.rankQueue.Enqueue(playerTuple);
        if (this.rankQueue.size() >= 2) {
          const playerList: WaitPlayerTuple[] | null =
            this.rankQueue.DequeueList();
          if (playerList === null) return 0;
          const roomId = this.makeRoomId();
          const gameRoom = new GameRoom(roomId);
          gameRoom.setUser(playerList[0][0], playerList[0][1]);
          gameRoom.setUser(playerList[1][0], playerList[2][1]);
          return this.playRoomList.push(gameRoom);
        }
        return 999;
      default:
        return 0;
    }
  }

  public async setRoomToDB(roomNumber: number) {
    const target = this.playRoomList[roomNumber];
    let type;
    if (target.option.getType() == GameType.RANK) {
      type = RecordType.SPECIAL;
    } else type = RecordType.NORMAL;

    const room = this.gameChannelRepository.create({
      type: type,
      userIdx1: target.user1.userIdx,
      userIdx2: target.user2.userIdx,
      score1: 0,
      score2: 0,
      status: RecordResult.DEFAULT,
    });

    await this.gameChannelRepository.save(room);
  }

  public getRoomByRoomNumber(roomNumber: number): GameRoom {
    return this.playRoomList[roomNumber];
  }

  public getRoomByUserIdx(userIdx: number): GameRoom | null {
    for (const room of this.playRoomList) {
      if (room.user1.userIdx === userIdx || room.user2.userIdx === userIdx)
        return room;
    }
    return null;
  }

  public setLatency(userIdx: number, roomId: string, latency: number): boolean {
    for (const room of this.playRoomList) {
      if (room.roomId === roomId) {
        if (room.user1.userIdx === userIdx) room.user1.setLatency(latency);
        else room.user2.setLatency(latency);
        if (room.user1.getLatency() != 0 && room.user2.getLatency() != 0) {
          return true;
        }
      }
    }
    return false;
  }

  public getReadyFirst(roomNumber: number, server: Server): boolean {
    const target = this.getRoomByRoomNumber(roomNumber);
    target.user1.socket.join(target.roomId);
    target.user2.socket.join(target.roomId);
    const finalOptions = new GameSmallOptionDto(
      target.option.getType(),
      target.option.getSpeed(),
      target.option.getMapNumber(),
    );
    return server.to(target.roomId).emit('game_ready_first', finalOptions);
  }

  public getReadySecond(roomNumber: number, server: Server): boolean {
    const target = this.getRoomByRoomNumber(roomNumber);
    const serverDateTime = Date.now();
    return server.to(target.roomId).emit('game_ready_first', serverDateTime);
  }

  public getReadyFinal(userIdx: number, server: Server): boolean {
    const target = this.getRoomByUserIdx(userIdx);
    const userNicknameFirst = target.user1.userObject.nickname;
    const userIdxFirst = target.user1.userIdx;
    const firstLatency = target.user1.getLatency();
    const userNicknameSecond = target.user2.userObject.nickname;
    const userIdxSecond = target.user2.userIdx;
    const secondLatency = target.user2.getLatency();
    server
      .to(target.roomId)
      .emit(
        'game_ready_final',
        userNicknameFirst,
        userIdxFirst,
        firstLatency,
        userNicknameSecond,
        userIdxSecond,
        secondLatency,
      );

    return this.startPong(target, server);
  }

  public startPong(targetRoom: GameRoom, server: Server): boolean {
    let latency = 0;
    if (targetRoom.user1.getLatency() > targetRoom.user2.getLatency())
      latency = targetRoom.user1.getLatency();
    else latency = targetRoom.user2.getLatency();
    // latency += 5000;
    const animationStartDate = new Date(Date.now());
    animationStartDate.setMilliseconds(
      animationStartDate.getMilliseconds() + latency,
    );
    const ball = targetRoom.ballList[0];
    const ballExpectedEventDate = new Date();
    return server
      .to(targetRoom.roomId)
      .emit(
        'game_start',
        animationStartDate,
        ball.nextX,
        ball.nextY,
        ballExpectedEventDate,
      );
  }

  public setWaitPlayer(userIdx: number, options: GameOptions): number {
    const player: GamePlayer = this.makeGamePlayer(userIdx);
    return this.waitingList.pushPlayer(player, options);
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
