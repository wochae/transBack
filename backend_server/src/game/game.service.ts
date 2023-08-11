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
import {
  GameType,
  GameSpeed,
  MapNumber,
  RecordType,
  RecordResult,
  GameStatus,
} from './enum/game.type.enum';
import { GameSmallOptionDto } from './dto/game.options.small.dto';
import { Server } from 'socket.io';
import { GameServerTimeDto } from './dto/game.server.time.dto';
import { GameFinalReadyDto } from './dto/game.final.ready.dto';
import { GameStartDto } from './dto/game.start.dto';
import { GamePaddleMoveDto } from './dto/game.paddle.move.dto';
import { GamePaddlePassDto } from './dto/game.paddle.pass.dto';
import { GameScoreDto } from './dto/game.score.dto';
import { GameScoreFinshDto } from './dto/game.score.finish.dto';

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

  public async checkStatus(msg: string) {
    console.log(msg);
    console.log(`PlayRoom List : ${this.playRoomList.length}`);
    for (let i = 0; i < this.playRoomList.length; i++) {
      console.log(`Room [${i}]`);
      await console.log(
        `play room List : ${this.playRoomList[i].user1.userObject.nickname}`,
      );
      await console.log(
        `play room List : ${this.playRoomList[i].user2.userObject.nickname}`,
      );
    }
    console.log(`Normal Queue List : ${this.normalQueue.size()}`);
    for (let i = 0; i < this.normalQueue.size(); i++) {
      await console.log(
        `normal Queue ${this.normalQueue.queueData[i][0].userObject.nickname}`,
      );
    }
    console.log(`Rank Queue List : ${this.rankQueue.size()}`);
    for (let i = 0; i < this.rankQueue.size(); i++) {
      await console.log(
        `rank Queue ${this.rankQueue.queueData[i][0].userObject.nickname}`,
      );
    }
    console.log(`Waiting List : ${this.waitingList.size()}`);
    for (let i = 0; i < this.waitingList.size(); i++) {
      await console.log(
        `normal Queue ${this.waitingList.waitPlayers[i][0].userObject.nickname}`,
      );
    }
    console.log(`Player List : ${this.onlinePlayerList.length}`);
    for (let i = 0; i < this.onlinePlayerList.length; i++) {
      console.log(`online List ${this.onlinePlayerList[i].user.nickname}`);
    }
    console.log(`${msg} is end`);
  }

  private deleteUserFromQueue(userIdx: number, queue: GameQueue) {
    for (let i = 0; i < queue.size(); i++) {
      if (queue.queueData[i][0].userIdx === userIdx) {
        queue.queueData.splice(i);
      }
    }
  }

  private findPlayerFromList(userIdx: number): number {
    for (let index = 0; index < this.onlinePlayerList.length; index++) {
      if (this.onlinePlayerList[index].user.userIdx == userIdx) return index;
    }
    return -1;
  }

  //TODO: check dubble login

  private makeGamePlayer(userIdx: number): GamePlayer | null {
    const index = this.findPlayerFromList(userIdx);
    if (index == -1) {
      //TODO: error handling
    }
    const user = this.onlinePlayerList[index];
    // console.log(`makeGamePlayer : ${user.user.nickname}`);
    const returnPlayer = new GamePlayer(userIdx, user.user, user.userSocket);
    // console.log(`makeGamePlayer 2: ${returnPlayer.userObject.nickname}`);
    return returnPlayer;
  }

  public makeRoomId(): string {
    const target = 'game_room_'.concat(this.cnt.toString());
    this.cnt++;
    return target;
  }

  public sizeWaitPlayer(): number {
    // console.log(`sizeWaitPlayer: ${this.waitingList.size()}`);
    return this.waitingList.size();
  }

  public async putInQueue(userIdx: number): Promise<Promise<number | null>> {
    const playerTuple: WaitPlayerTuple = this.waitingList.popPlayer(userIdx);
    // console.log(playerTuple[0].userIdx);
    // console.log(playerTuple[0].userObject.nickname);
    // console.log(playerTuple[1].getType());
    // const value = playerTuple[1].getType();
    let returnValue;
    returnValue = 0;
    console.log(playerTuple[1].getType() == GameType.RANK ? true : false);
    console.log(GameType.RANK);
    switch (playerTuple[1].getType()) {
      // switch (value) {
      case GameType.FRIEND:
        console.log('Friend is here');
        break;
      case GameType.NORMAL:
        console.log('Normal is here');
        this.normalQueue.Enqueue(playerTuple);
        if (this.normalQueue.size() >= 2) {
          const playerList: WaitPlayerTuple[] | null =
            this.normalQueue.DequeueList();
          const roomId = this.makeRoomId();
          const gameRoom = new GameRoom(roomId);
          gameRoom.setUser(playerList[0][0], playerList[0][1]);
          gameRoom.setUser(playerList[1][0], playerList[1][1]);
          returnValue = this.playRoomList.length;
          this.playRoomList.push(gameRoom);
          return returnValue;
        }
        break;
      case GameType.RANK:
        console.log('Rank is here');
        this.rankQueue.Enqueue(playerTuple);
        if (this.rankQueue.size() >= 2) {
          console.log('Rank is here2');
          const playerList: WaitPlayerTuple[] | null =
            this.rankQueue.DequeueList();
          //   console.log(`player queue ${playerList.length}`);
          const roomId = this.makeRoomId();
          //   console.log(`room ID : ${roomId}`);

          const gameRoom = new GameRoom(roomId);
          // console.log(`room ID : ${roomId}`);
          await gameRoom.setUser(playerList[0][0], playerList[0][1]);
          // console.log(
          //   `player 1 Ready : ${playerList[0][0].userObject.nickname}`,
          // );
          await gameRoom.setUser(playerList[1][0], playerList[1][1]);
          // console.log(
          //   `player 2 Ready : ${playerList[1][0].userObject.nickname}`,
          // );

          returnValue = this.playRoomList.length;
          this.playRoomList.push(gameRoom);
          console.log(returnValue);

          return returnValue;
        }
        break;
      default:
        return -1;
    }
    return null;
  }

  public async setRoomToDB(roomNumber: number) {
    const target = this.playRoomList[roomNumber];
    let type;
    if (target.option.getType() == GameType.RANK) {
      type = RecordType.RANK;
    } else type = RecordType.NORMAL;

    const room = this.gameChannelRepository.create({
      type: type,
      userIdx1: target.user1.userIdx,
      userIdx2: target.user2.userIdx,
      score1: 0,
      score2: 0,
      status: RecordResult.DEFAULT,
    });
    target.setChannelObject(room);
    await this.gameChannelRepository.save(room);
    const gameIdx = room.gameIdx;
    console.log(gameIdx);
    const record1 = await this.gameRecordRepository.create({
      gameIdx: gameIdx,
      userIdx: target.user1.userIdx,
      matchUserNickname: target.user2.userObject.nickname,
      matchUserIdx: target.user2.userIdx,
      type: type,
      result: RecordResult.DEFAULT,
      score: '',
      matchDate: new Date(),
    });
    const record2 = await this.gameRecordRepository.create({
      gameIdx: gameIdx,
      userIdx: target.user2.userIdx,
      matchUserNickname: target.user1.userObject.nickname,
      matchUserIdx: target.user1.userIdx,
      type: type,
      result: RecordResult.DEFAULT,
      score: '',
      matchDate: record1.matchDate,
    });

    target.setChannelObject(room);
    target.setRecordObject(record1);
    target.setRecordObject(record2);

    await this.gameRecordRepository.save(record1);
    await this.gameRecordRepository.save(record2);
    console.log('DB 저장 성공');
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
        if (room.user1.getLatency() != -1 && room.user2.getLatency() != -1) {
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
    const serverDateTime = new GameServerTimeDto(target.roomId, Date.now());
    return server.to(target.roomId).emit('game_ready_first', serverDateTime);
  }

  public getReadyFinal(userIdx: number, server: Server): boolean {
    const target = this.getRoomByUserIdx(userIdx);
    const finalReady = new GameFinalReadyDto(target);
    server.to(target.roomId).emit('game_ready_final', finalReady);

    return this.startPong(target, server);
  }

  public startPong(targetRoom: GameRoom, server: Server): boolean {
    let latency = 0;
    if (targetRoom.user1.getLatency() > targetRoom.user2.getLatency())
      latency = targetRoom.user1.getLatency();
    else latency = targetRoom.user2.getLatency();
    // latency += 5000;
    const ball = targetRoom.ballList[0];
    const ballExpectedEventDate = new Date();
    const startBall = new GameStartDto(
      Date.now() + latency,
      ballExpectedEventDate.getTime(),
      ball,
    );
    return server.to(targetRoom.roomId).emit('game_start', startBall);
  }

  public setWaitPlayer(userIdx: number, options: GameOptions): number {
    // console.log('here?');
    const player = this.makeGamePlayer(userIdx);
    // console.log(`setWaitPlayer Test ${player.userObject.nickname}`);
    return this.waitingList.pushPlayer(player, options);
  }

  public async pushOnlineUser(player: GameOnlineMember): Promise<number> {
    const index = this.findPlayerFromList(player.user.userIdx);

    if (index != -1) return -1;

    if (player.user.isOnline == false) player.user.isOnline = true;
    await this.userObjectRepository.save(player.user);
    this.onlinePlayerList.push(player);
    // console.log(this.onlinePlayerList[index].user.nickname);
    return this.onlinePlayerList.length;
  }

  public async popOnlineUser(userIdx: number): Promise<number> {
    const index = this.findPlayerFromList(userIdx);

    if (index == -1) return this.onlinePlayerList.length;

    this.onlinePlayerList[index].user.isOnline = false;
    await this.userObjectRepository.save(this.onlinePlayerList[index].user);
    this.onlinePlayerList.splice(index);

    return this.onlinePlayerList.length;
  }

  public async deleteUserFromAllList(userIdx: number) {
    this.deleteUserFromQueue(userIdx, this.normalQueue);
    this.deleteUserFromQueue(userIdx, this.rankQueue);
    await this.popOnlineUser(userIdx);
  }

  public async movePaddle(
    paddleMove: GamePaddleMoveDto,
    time: number,
  ): Promise<number> {
    const { userIdx, clientDate, paddleInput } = paddleMove;
    const latency = time - clientDate;
    const targetRoom = this.getRoomByUserIdx(userIdx);
    const targetUser =
      targetRoom.user1.userIdx === userIdx
        ? targetRoom.user2
        : targetRoom.user1;
    await targetUser.socket.emit(
      'game_move_paddle',
      new GamePaddlePassDto(latency, paddleInput),
    );
    // play Room 찾기
    // 상대방 찾기
    // 레이턴 계산하기
    // 상대 전달하기

    return latency;
  }

  private checkScoreData(datas: GameScoreDto[]): boolean {
    if (datas[0].userIdx !== datas[1].userIdx) return false;
    if (datas[0].score !== datas[1].score) return false;
    return true;
  }

  private getRoomIdxWithRoom(targetRoom: GameRoom): number {
    let index = 0;

    for (const room of this.playRoomList) {
      if (
        room.user1.userIdx == targetRoom.user1.userIdx &&
        room.user2.userIdx == targetRoom.user2.userIdx
      )
        return index;
      index++;
    }

    return -1;
  }

  private async winnerScoreHandling(
    user1: GamePlayer,
    user2: GamePlayer,
    room: GameRoom,
    server: Server,
  ) {
    await this.gameChannelRepository.save(
      room.saveChannelObject(user1.score, user2.score, RecordResult.DONE),
    );
    const records = room.saveRecordObject(
      user1.score,
      user2.score,
      RecordResult.WIN,
      RecordResult.LOSE,
    );

    await this.gameRecordRepository.save(records[0]).then(async () => {
      await this.gameRecordRepository.save(records[1]);
    });

    const finishData = new GameScoreFinshDto(
      user1,
      user2,
      GameStatus.TERMINATION,
    );
    const targetIdx = this.getRoomIdxWithRoom(room);

    await server.to(room.roomId).emit('game_get_score', finishData);
    user1.socket.leave(room.roomId);
    user2.socket.leave(room.roomId);
    this.playRoomList.splice(targetIdx);
    this.popOnlineUser(user1.userIdx);
    this.popOnlineUser(user2.userIdx);
    user1.socket.disconnect(true);
    user2.socket.disconnect(true);
  }

  private async scoreHandling(
    user1: GamePlayer,
    user2: GamePlayer,
    room: GameRoom,
    server: Server,
  ) {
    await this.gameChannelRepository.save(
      room.saveChannelObject(user1.score, user2.score, RecordResult.PLAYING),
    );
    const records = room.saveRecordObject(
      user1.score,
      user2.score,
      RecordResult.PLAYING,
      RecordResult.PLAYING,
    );
    await this.gameRecordRepository.save(records[0]).then(async () => {
      await this.gameRecordRepository.save(records[1]);
    });

    const finishData = new GameScoreFinshDto(user1, user2, GameStatus.ONGOING);
    await server.to(room.roomId).emit('game_get_score', finishData);
    room.predictBallCourse(0, 0);
    await this.startPong(room, server);
  }

  public async handleScore(scoreData: GameScoreDto, server: Server) {
    const userIdx = scoreData.userIdx;
    const targetRoom = this.getRoomByUserIdx(userIdx);
    if (targetRoom.setScoreData(scoreData)) {
      const datas = targetRoom.getScoreDataList();
      if (this.checkScoreData(datas)) {
        if (targetRoom.user1.userIdx === datas[0].userIdx) {
          targetRoom.user1.score = datas[0].score;
          if (datas[0].score === 5) {
            await this.winnerScoreHandling(
              targetRoom.user1,
              targetRoom.user2,
              targetRoom,
              server,
            );
            // DB 저장
            // API 13
            // 게임 종료 및 방 정리
          } else {
            await this.scoreHandling(
              targetRoom.user1,
              targetRoom.user2,
              targetRoom,
              server,
            );
            // DB 저장
            // 재시작 준비
          }
        } else {
          targetRoom.user2.score = datas[0].score;
          if (datas[0].score === 5) {
            await this.winnerScoreHandling(
              targetRoom.user2,
              targetRoom.user1,
              targetRoom,
              server,
            );
            // API 13
            // DB 저장
            // 게임 종료 및 방 정리
          } else {
            await this.scoreHandling(
              targetRoom.user2,
              targetRoom.user1,
              targetRoom,
              server,
            );
            // DB 저장
            // 재시작 준비
          }
        }
      } else {
        //TODO: error handling
      }
    }
  }
}
