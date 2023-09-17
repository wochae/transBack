import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { UserObjectRepository } from 'src/users/users.repository';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';
import { GamePlayer } from './class/game.player/game.player';
import { GameOptionDto } from './dto/game.option.dto';
import { OnlineStatus, UserObject } from 'src/entity/users.entity';
import {
  GameStatus,
  GameType,
  RecordResult,
  RecordType,
} from './enum/game.type.enum';
import { GameQueue } from './class/game.queue/game.queue';
import { GameRoom } from './class/game.room/game.room';
import { GamePhase } from './enum/game.phase';
import { Socket, Server } from 'socket.io';
import { GameChannel } from 'src/entity/gameChannel.entity';
import { GameRecord } from 'src/entity/gameRecord.entity';
import { GameQueueSuccessDto } from './dto/game.queue.suceess.dto';
import { GamePingDto } from './dto/game.ping.dto';
import { GamePauseScoreDto } from './dto/game.pause.score.dto';
import { LoggerWithRes } from 'src/shared/class/shared.response.msg/shared.response.msg';
import { GameFrameDataDto } from './dto/game.frame.data.dto';
import { KeyPressDto } from './dto/key.press.dto';
import { GameResultDto } from './dto/game.result.dto';
import { Vector } from './enum/game.vector.enum';
import { GameForceQuitDto } from './dto/game.force.quit.dto';
import { GameInviteOptionDto } from './dto/game.invite.option.dto';
import { UserProfileGameDto } from './dto/game.record.dto';

@Injectable()
export class GameService {
  private playRoom: GameRoom[]; // 플레이 룸
  private normalQueue: GameQueue; // 게임을 위한 큐
  private rankQueue: GameQueue; // 게임을 위한 큐
  private friendQueue: [GamePlayer, GameInviteOptionDto][]; // 게임을 위한 큐
  private onLinePlayer: [GamePlayer, GameType][]; // online player
  private processedUserIdxList: number[]; // disconnect 처리한
  private nameCnt: number;
  private today: string;
  private frameData: GameFrameDataDto;
  messanger: LoggerWithRes = new LoggerWithRes('GameService');

  constructor(
    private gameRecordRepository: GameRecordRepository,
    private gameChannelRepository: GameChannelRepository,
    private readonly userService: UsersService,
    private readonly inMemoryUsers: InMemoryUsers,
  ) {
    this.playRoom = [];
    this.normalQueue = new GameQueue();
    this.rankQueue = new GameQueue();
    this.friendQueue = [];
    this.onLinePlayer = [];
    this.processedUserIdxList = [];
    this.nameCnt = 0;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const formattedDate = `${year}-${month}-${day}`;
    this.today = formattedDate;
    this.frameData = new GameFrameDataDto(null, null);
  }

  // PROFILE_INFINITY
  async getGameRecordsByInfinity(
    userIdx: number,
    page: number,
  ): Promise<UserProfileGameDto[]> {
    const skip = page * 3; // items per page fixed
    const records = await this.gameRecordRepository.find({
      select: [
        // 'idx','gameIdx',
        'matchUserIdx',
        'matchUserNickname',
        'score',
        'type',
        'result',
      ],
      where: { userIdx },
      order: { matchDate: 'DESC' },
      skip,
      take: 3,
    });
    // console.log('getGameRecordsByInfinity', records);
    return records;
  }

  // player 만들기
  async makePlayer(data: GameOptionDto): Promise<GamePlayer | null> {
    console.log(`userIdx: ${data.userIdx}`);
    const getPerson = await this.inMemoryUsers.getUserByIdFromIM(data.userIdx);
    console.log(`userIdx: ${data.userIdx}`);

    if (getPerson === undefined) return null;

    const player = new GamePlayer(getPerson);
    player.setOptions(data);
    getPerson.isOnline = OnlineStatus.ONGAME; //TODO: chat과 연계 버그 확인 필요
    const target = await this.inMemoryUsers.saveUserByUserIdFromIM(
      getPerson.userIdx,
    );
    console.log(`userIdx: ${data.userIdx}`);

    if (target === null) return null;
    player.setUserObject(target);
    return player;
  }

  private checkProccessedOrNot(userIdx: number) {
    const index = this.processedUserIdxList.findIndex((Idx) => Idx === userIdx);
    if (index === -1) return;
    this.processedUserIdxList.splice(index, 1);
  }

  // 큐에 플레이어를 넣어둔다.
  putInQueue(player: GamePlayer, option: null | GameInviteOptionDto) {
    if (option === null) {
      const type = player.getOption().gameType;
      this.checkProccessedOrNot(player.getUserObject().userIdx);
      this.onLinePlayer.push([player, player.getOption().gameType]);
      switch (type) {
        case GameType.NORMAL:
          this.normalQueue.pushPlayer(player);
          break;
        case GameType.RANK:
          this.rankQueue.pushPlayer(player);
          break;
      }
    } else {
      this.checkProccessedOrNot(player.getUserObject().userIdx);
      this.onLinePlayer.push([player, player.getOption().gameType]);
      this.friendQueue.push([player, option]);
      return;
    }
  }

  // 플레이어가 커넥션이 연결됨에 따라, 소켓을 설정해준다.
  setSocketToPlayer(clientSocket: Socket, userIdx: number): boolean {
    console.log('setSocketToPlayer here start');
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        member[0].setSocket(clientSocket);
        console.log('setSocketToPlayer here end');
        return true;
      }
    }
    return false;
  }

  // 큐 내부를 파악하고, 게임 상대가 준비되었는지 확인한다.
  checkQueue(userIdx: number): GamePlayer[] {
    console.log(`userIdx 확인 전 : ` + userIdx);
    const target: [GamePlayer, GameType] = this.onLinePlayer.find(
      (user) => user[0].getUserObject().userIdx === userIdx,
    );
    console.log(`UserIdx 확인 후 : ` + target[0].getUserObject().userIdx);
    const type = target[1];
    console.log(`type : ${type}`);
    let targetQueue: GameQueue;
    switch (type) {
      case GameType.FRIEND:
        console.log(`friend Queue : ${this.friendQueue}`);
        const friendQue = this.friendQueue;
        const player1 = friendQue.find(
          (player) =>
            player[0].getUserObject().userIdx ===
            target[0].getUserObject().userIdx,
        );
        // console.log(`player 1: ${player1}`);
        // console.log(`player 1 - userIdx : ${player1[1].userIdx}`);
        // console.log(`player 1 - targetIdx : ${player1[1].targetIdx}`);

        /**
		 * 
			A -> A, B , 0, 1, 2
			B -> B, A, 0 , 1, 2 
		 */
        const player2 = friendQue.find(
          (player) =>
            player[0].getUserObject().userIdx === player1[1].targetIdx,
        );
        console.log(`player 2: ${player2}`);

        if (player2 === undefined) return undefined;
        else {
          const player1Index = friendQue.findIndex(
            (player) =>
              player[0].getUserObject().userIdx ===
              target[0].getUserObject().userIdx,
          );
          friendQue.splice(player1Index, 1);
          const player2Index = friendQue.findIndex(
            (player) =>
              player[0].getUserObject().userIdx === player1[1].targetIdx,
          );
          friendQue.splice(player2Index, 1);
          const list: GamePlayer[] = [];
          list.push(player1[0]);
          list.push(player2[0]);
          console.log(list);
          return list;
        }
      case GameType.NORMAL:
        targetQueue = this.normalQueue;
        break;
      case GameType.RANK:
        targetQueue = this.rankQueue;
        break;
    }
    if (
      (type === GameType.NORMAL || type === GameType.RANK) &&
      targetQueue.getLength() >= 2
    ) {
      //   console.log('here it is!!!');
      const list = targetQueue.popPlayer(target[0].getUserObject().userIdx);
      return list;
    } else return undefined;
  }

  // 플레이어의 온라인 상태를 게임 중으로 바꾼다.
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
    target[0].setUserObject(
      await this.inMemoryUsers.saveUserByUserIdFromIM(userIdx),
    );
  }

  // play room 을 구성한다.
  async makePlayerRoom(players: GamePlayer[], server: Server, userIdx: number) {
    const roomName = this.makeRoomName();
    this.messanger.logWithMessage('makePlayerRoom', '', '', `${roomName}`);

    const option = this.setOptions(players);
    this.messanger.logWithMessage(
      'makePlayerRoom',
      '',
      '',
      `${option.userIdx}`,
    );

    const channel = this.makeGameChannel(players);
    this.messanger.logWithMessage(
      'makePlayerRoom',
      '',
      '',
      `${players.length}`,
    );

    const newChannel = await this.gameChannelRepository.save(channel);
    this.messanger.logWithMessage(
      'makePlayerRoom',
      '',
      '',
      `${channel.userIdx1} ${channel.userIdx2} / ${channel.matchDate}`,
    );

    const gameRecord = this.makeGameHistory(players, newChannel);
    // TODO: FIX here
    const record0 = await this.gameRecordRepository.save(gameRecord[0]);
    const record1 = await this.gameRecordRepository.save(gameRecord[1]);
    (await gameRecord).splice(0, 2);
    (await gameRecord).push(record0);
    (await gameRecord).push(record1);
    const room = new GameRoom(
      roomName,
      players,
      option.gameType,
      option.speed,
      option.mapNumber,
      await gameRecord,
      channel,
      100,
    );
    players[0].getSocket().join(roomName);
    players[1].getSocket().join(roomName);
    this.playRoom.push(room);
    room.setNewGame(room);
    room.setGamePhase(GamePhase.MAKE_ROOM);

    const data = new GameQueueSuccessDto(
      channel.gameIdx,
      players,
      room.gameObj.gameType,
      room.gameObj.gameSpeed,
      room.gameObj.gameMapNumber,
    );
    if (room.users[0].getUserObject().userIdx === userIdx) {
      setTimeout(() => {
        room.users[1].getSocket().emit('game_queue_success', data);
      }, 400);
      setTimeout(() => {
        room.users[0].getSocket().emit('game_queue_success', data);
      }, 500);
    } else {
      setTimeout(() => {
        room.users[0].getSocket().emit('game_queue_success', data);
      }, 400);
      setTimeout(() => {
        room.users[1].getSocket().emit('game_queue_success', data);
      }, 500);
    }
  }

  // play room 의 이름을 설정한다.
  private makeRoomName(): string {
    const ret = `room_${this.today}_${this.nameCnt++}`;
    return ret;
  }

  // 옵션을 랜덤하게 정해준다.
  private setOptions(players: GamePlayer[]): GameOptionDto {
    const randomInt = this.getRandomInt(1, 2) - 1;
    return players[randomInt].getOption();
  }

  // 랜덤 값을 얻기 위한 메소드
  private getRandomInt(min: number, max: number): number {
    let randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randomValue == 0) randomValue = 1;
    return randomValue;
  }

  // DB 저장을 위한 channel 객체를 생성한다.
  private makeGameChannel(players: GamePlayer[]): GameChannel {
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
      matchDate: new Date(),
    });
    return ret;
  }

  // DB 저장을 위한 Record 객체를 생성한다.
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

  // game_queue_success 를 진행하면서, 들어오는 반환값들이 정상 처리가 되느지를 확인한다. true 가 나오면 플레이어 1, 2가 모두 준비된 상태를 의미하다.
  checkReady(userIdx: number): boolean | null {
    const room = this.findGameRoomById(userIdx);
    console.log('room', room);
    if (room === null) return null;
    if (room.users[0].getUserObject().userIdx === userIdx)
      room.users[0].setReady(userIdx);
    else room.users[1].setReady(userIdx);
    return room.users[0].getReady() && room.users[1].getReady();
  }

  uncheckReady(userIdx: number) {
    const room = this.findGameRoomById(userIdx);
    if (room === null) return;
    room.users[0].setReady(-1);
    room.users[1].setReady(-1);
    return;
  }

  // play room 을 userIdx 를 활용해서 탐색해낸다.
  public findGameRoomById(userIdx: number): GameRoom | null {
    for (const room of this.playRoom) {
      if (room.users[0].getUserObject().userIdx === userIdx) {
        return room;
      } else if (room.users[1].getUserObject().userIdx === userIdx) {
        return room;
      }
    }
    return null;
  }

  // 게임 룸을 usrId 로 확인된 방을 전달한다.
  public findGameRoomIdByUserId(userIdx: number): string {
    for (const room of this.playRoom) {
      if (
        room.users[0].getUserObject().userIdx.valueOf() === userIdx.valueOf()
      ) {
        return room.roomId;
      } else if (
        room.users[1].getUserObject().userIdx.valueOf() === userIdx.valueOf()
      ) {
        return room.roomId;
      }
    }
  }

  // Room 의 이름으로 룸을 가
  public findGameRoomByRoomId(roomId: string): GameRoom {
    // const target = this.playRoom.find(
    //   (room) => room.roomId.valueOf() === roomId.valueOf(),
    // );
    let target;
    for (let i = 0; i < this.playRoom.length; i++) {
      if (this.playRoom[i].roomId.valueOf() === roomId.valueOf()) {
        target = this.playRoom[i];
        break;
      }
    }
    return target;
  }

  public readyToSendPing(roomId: string, server: Server) {
    let target;
    for (let i = 0; i < this.playRoom.length; i++) {
      if (this.playRoom[i].roomId.valueOf === roomId.valueOf) {
        target = this.playRoom[i];
        break;
      }
    }
    target.intervalId = setInterval(() => {
      this.sendPingToRoom(target, server);
    }, 15);
  }

  // 실제 초반 레이턴시 확정을 위한 핑 보내는 메서드
  public sendPingToRoom(room: GameRoom, server: Server) {
    const target = new GamePingDto();
    server.to(room.roomId).emit('game_ping', target);
  }

  // 핑의 수신 용도
  public receivePing(
    userIdx: number,
    latency: number,
    server: Server,
  ): boolean | number {
    // this.messanger.logWithMessage("receive ping", "" , "" , "start here");
    const targetRoom = this.findGameRoomById(userIdx);

    let latencyIdx;
    if (targetRoom.users[0].getUserObject().userIdx === userIdx) latencyIdx = 0;
    else latencyIdx = 1;
    // this.messanger.logWithMessage("receive ping", "" , "" ,`latency Idx : ${latencyIdx}`);
    targetRoom.latencyCnt[latencyIdx] += 1;

    if (targetRoom.latency[latencyIdx] === 0) {
      targetRoom.latency[latencyIdx] += latency;
    } else {
      targetRoom.latency[latencyIdx] += latency;
      targetRoom.latency[latencyIdx] = Math.round(
        targetRoom.latency[latencyIdx] / 2,
      );
      console.log(`data latency : ${latency}`);
      //   console.log(`data clientTime : ${data.clientTime}`);
      console.log(`Player ${latencyIdx} : ${targetRoom.latency[latencyIdx]}`);
    }
    // TODO: Lateyncy cnt to change
    console.log(`target ${latencyIdx} : ${targetRoom.latencyCnt[latencyIdx]}`);
    if (targetRoom.latencyCnt[latencyIdx] === 30) {
      if (targetRoom.latencyCnt[0] >= 30 && targetRoom.latencyCnt[1] >= 30) {
        targetRoom.stopInterval();
        targetRoom.setGamePhase(GamePhase.SET_NEW_GAME);
        if (this.sendSetFrameRate(userIdx, server) === -1) return -1;
        targetRoom.latencyCnt.splice(0, 2);
        targetRoom.latencyCnt.push(0);
        targetRoom.latencyCnt.push(0);
        return true;
      }
    }
    return false;
  }

  public checkLatencyOnPlay(
    target: GameRoom,
    keyData: KeyPressDto,
    server: Server,
  ) {
    let latencyCnt;
    let latencyIdx;
    if (target.users[0].getUserObject().userIdx === keyData.userIdx)
      latencyIdx = 0;
    else latencyIdx = 1;
    latencyCnt[latencyIdx] += 1;
    if (target.latency[latencyIdx] == 0) {
      target.latency[latencyIdx] += keyData.clientTime - keyData.serverTime;
    } else {
      target.latency[latencyIdx] += keyData.clientTime - keyData.serverTime;
      target.latency[latencyIdx] = Math.round(target.latency[latencyIdx] / 2);
    }
    if (latencyCnt[latencyIdx] == target.getMaxFps()) {
      if (
        target.latencyCnt[0] >= target.getMaxFps() &&
        target.latency[1] >= target.getMaxFps()
      ) {
        if (this.sendSetFrameRate(keyData.userIdx, server) === -1) return false;
        target.latencyCnt.splice(0, 2);
        target.latencyCnt.push(0);
        target.latencyCnt.push(0);
        return true;
      }
    }
    return false;
  }

  // 받은 핑을 통해 프레임 Max 값을 설정하고, 레이턴시를 지정한다.
  public sendSetFrameRate(userIdx: number, server: Server): number {
    const targetRoom = this.findGameRoomById(userIdx);
    const targetLatency =
      targetRoom.latency[0] >= targetRoom.latency[1]
        ? targetRoom.latency[0]
        : targetRoom.latency[1];
    const gap = Math.abs(targetRoom.latency[0] - targetRoom.latency[1]);
    if (gap >= 100) {
      //   server
      //     .to(targetRoom.roomId)
      //     .emit(
      //       'game_force_quit',
      //       new GameForceQuitDto(
      //         `Networking states is bad to continue proper game.`,
      //       ),
      //     );
      targetRoom.stopInterval();
      targetRoom.deleteRoom();
      return -1;
    }
    // targetRoom.intervalPeriod
    return targetRoom.setLatency(targetLatency, targetRoom);
  }

  // 최초 게임 시작시, 여기서 게임이 시작된다.
  public startGame(userIdx: number, server: Server, gameService: GameService) {
    let targetRoom: GameRoom;
    for (const room of gameService.playRoom) {
      if (room.users[0].getUserObject().userIdx === userIdx) {
        targetRoom = room;
        break;
      } else if (room.users[1].getUserObject().userIdx === userIdx) {
        targetRoom = room;
        break;
      }
    }
    // targetRoom.setNewGame(targetRoom);
    console.log(`game Phase : ${targetRoom.getGamePhase()}`);
    if (targetRoom.getGamePhase() != GamePhase.SET_NEW_GAME) return;
    targetRoom.setGamePhase(GamePhase.ON_PLAYING);
    console.log(`target Interval Ms : ${targetRoom.getIntervalMs()}`);
    targetRoom.setIntervalId(
      setInterval(() => {
        gameService.startRendering(targetRoom, server, gameService);
      }, targetRoom.getIntervalMs()),
    );
  }

  // 프레임을 전달하는 함수
  private async startRendering(
    room: GameRoom,
    server: Server,
    gameService: GameService,
  ) {
    room.makeNextFrame(room);
    const status: GamePhase = room.getGamePhase();
    if (
      status === GamePhase.SET_NEW_GAME ||
      status === GamePhase.MATCH_END ||
      status === GamePhase.FORCE_QUIT
    ) {
      room.stopInterval();
      if (status === GamePhase.SET_NEW_GAME) {
        server
          .to(room.roomId)
          .emit(
            'game_pause_score',
            new GamePauseScoreDto(room.users, room.gameObj, GameStatus.ONGOING),
          );
        // handling set New game ;
        room.setReGame(room);
        return;
      } else if (status === GamePhase.FORCE_QUIT) {
        // TODO: 강제 종료 로직
        server
          .to(room.roomId)
          .emit(
            'game_pause_score',
            new GamePauseScoreDto(room.users, room.gameObj, GameStatus.JUDGE),
          );
        await this.gameChannelRepository.save(room.channel);
        await this.gameRecordRepository.save(room.history[0]);
        await this.gameRecordRepository.save(room.history[1]);
        await this.inMemoryUsers.saveUserByUserIdFromIM(
          room.users[0].getUserObject().userIdx,
        );
        await this.inMemoryUsers.saveUserByUserIdFromIM(
          room.users[1].getUserObject().userIdx,
        );
        const name =
          room.history[0].result === RecordResult.LOSE
            ? room.history[0].matchUserNickname
            : room.history[1].matchUserNickname;
        server
          .to(room.roomId)
          .emit(
            'game_force_quit',
            new GameForceQuitDto(`Game is forcely quit, Because of ${name}`),
          );
        this.processedUserIdxList.push(
          room.users[0].getUserObject().userIdx.valueOf(),
        );
        this.processedUserIdxList.push(
          room.users[1].getUserObject().userIdx.valueOf(),
        );
        this.deleteplayRoomByRoomId(room.roomId);
      } else if (status === GamePhase.MATCH_END) {
        room.syncStatus(room);
        server
          .to(room.roomId)
          .emit(
            'game_pause_score',
            new GamePauseScoreDto(room.users, room.gameObj, GameStatus.END),
          );
      }

      const user1 = room.users[0].getUserObject();
      const user2 = room.users[1].getUserObject();

      if (room.channel.score1 === 5) {
        user1.win += 1;
        user2.lose += 1;
        if (room.channel.type === RecordType.RANK) {
          let correctionValue1;
          let correctionValue2;
          if (user1.rankpoint > user2.rankpoint) {
            correctionValue1 = user2.rankpoint / user1.rankpoint;
            correctionValue2 = user1.rankpoint / user2.rankpoint;
          } else {
            correctionValue2 = user2.rankpoint / user1.rankpoint;
            correctionValue1 = user1.rankpoint / user2.rankpoint;
          }
          user1.rankpoint += 100 * correctionValue1;
          user2.rankpoint -= 100 * correctionValue2;
        }
      } else if (room.channel.score2 === 5) {
        user2.win += 1;
        user1.lose += 1;
        if (room.channel.type === RecordType.RANK) {
          let correctionValue1;
          let correctionValue2;
          if (user1.rankpoint > user2.rankpoint) {
            correctionValue1 = user2.rankpoint / user1.rankpoint;
            correctionValue2 = user1.rankpoint / user2.rankpoint;
          } else {
            correctionValue2 = user2.rankpoint / user1.rankpoint;
            correctionValue1 = user1.rankpoint / user2.rankpoint;
          }
          user2.rankpoint += 100 * correctionValue1;
          user1.rankpoint -= 100 * correctionValue2;
        }
      }
      this.processedUserIdxList.push(
        room.users[0].getUserObject().userIdx.valueOf(),
      );
      this.processedUserIdxList.push(
        room.users[1].getUserObject().userIdx.valueOf(),
      );

      await this.gameChannelRepository.save(room.getChannel());
      await this.gameRecordRepository.save(room.getHistories()[0]);
      await this.gameRecordRepository.save(room.getHistories()[1]);
      await this.inMemoryUsers.saveUserByUserIdFromIM(user1.userIdx);
      await this.inMemoryUsers.saveUserByUserIdFromIM(user2.userIdx);
      this.deleteplayRoomByRoomId(room.roomId);
    } else if (status === GamePhase.ON_PLAYING) {
      gameService.frameData.setData(room.getGameData(), Date.now());
      server.to(room.roomId).emit('game_frame', gameService.frameData);
    }
  }

  public async getHistoryByGameId(
    gameIdx: number,
    userIdx: number,
  ): Promise<GameResultDto> {
    const record = await this.gameRecordRepository.findOneBy({
      gameIdx: gameIdx,
      userIdx: userIdx,
    });

    const result = new GameResultDto(record);

    return result;
  }

  public deleteplayRoomByRoomId(roomId: string) {
    let room = this.playRoom.find((room) => room.roomId === roomId);
    let target1 = room.users[0];
    let target2 = room.users[1];
    let target1Index = this.onLinePlayer.findIndex(
      (target) =>
        target[0].getUserObject().userIdx === target1.getUserObject().userIdx,
    );
    if (target1Index != -1) this.onLinePlayer.splice(target1Index, 1);
    let target2Index = this.onLinePlayer.findIndex(
      (target) =>
        target[0].getUserObject().userIdx === target2.getUserObject().userIdx,
    );
    target1Index = undefined;
    target2Index = undefined;
    room = undefined;
    this.processedUserIdxList.push(target1.getUserObject().userIdx.valueOf());
    this.processedUserIdxList.push(target2.getUserObject().userIdx.valueOf());
    target1.setUserObject(undefined);
    target2.setUserObject(undefined);
    target1 = undefined;
    target2 = undefined;
    if (target2Index != -1) this.onLinePlayer.splice(target2Index, 1);
    const index = this.playRoom.findIndex((room) => room.roomId === roomId);
    this.playRoom.splice(index, 1);
    roomId = undefined;
  }

  public async pullOutQueuePlayerByUserId(userIdx: number): Promise<boolean> {
    const targetIndexFromOnlineMember = this.onLinePlayer.findIndex(
      (player) => player[0].getUserObject().userIdx === userIdx,
    );
    if (targetIndexFromOnlineMember === -1) return;
    let player = this.onLinePlayer.splice(targetIndexFromOnlineMember, 1);
    let targetQueue: GameQueue;
    if (player[0][1] === GameType.NORMAL) {
      targetQueue = this.normalQueue;
      targetQueue.deletePlayer(userIdx);
    } else if (player[0][1] === GameType.RANK) {
      targetQueue = this.rankQueue;
      targetQueue.deletePlayer(userIdx);
    } else {
      const targetQueue = this.friendQueue;
      const idx = targetQueue.findIndex(
        (player) => player[0].getUserObject().userIdx === userIdx,
      );
      targetQueue.splice(idx, 1);
    }
    player[0][0].getSocket().disconnect(true);
    player[0][0].setSocket(undefined);
    player[0][0].getUserObject().isOnline = OnlineStatus.ONLINE;
    await this.inMemoryUsers.saveUserByUserIdFromIM(
      player[0][0].getUserObject().userIdx,
    );
    player[0][0].setUserObject(undefined);
    this.processedUserIdxList.push(userIdx);
    player = undefined;
  }

  private changeChannelforWinnerAndLoser(
    winner: UserObject,
    loser: UserObject,
    room: GameRoom,
  ): GameRoom {
    winner.isOnline = OnlineStatus.OFFLINE;
    winner.win++;
    loser.isOnline = OnlineStatus.OFFLINE;
    loser.lose++;
    if (room.gameObj.gameType === GameType.RANK) {
      const correctionValue1 = loser.rankpoint / winner.rankpoint;
      const correctionValue2 = winner.rankpoint / loser.rankpoint;
      winner.rankpoint += 100 * correctionValue1;
      loser.rankpoint -= 100 * correctionValue2;
    }
    const channel: GameChannel = room.channel;
    channel.status = RecordResult.DONE;
    return room;
  }

  private changeHistoryForWinnerAndLoser(
    winnerIndex: number,
    histories: GameRecord[],
  ): GameRecord[] {
    histories[winnerIndex].result = RecordResult.WIN;
    let loserIndex: number;
    if (winnerIndex - 1 === 0) {
      loserIndex = 0;
    } else loserIndex = 1;
    histories[loserIndex].result = RecordResult.LOSE;
    return histories;
  }

  public forceQuitMatch(loser: number, server: Server): boolean {
    let room = this.findGameRoomById(loser);
    // room.stopInterval();
    let histories = room.getHistories();
    const p1 = room.users[0].getUserObject();
    const p2 = room.users[1].getUserObject();
    if (p1.userIdx === loser) {
      room = this.changeChannelforWinnerAndLoser(p2, p1, room);
      histories = this.changeHistoryForWinnerAndLoser(1, histories);
    } else {
      room = this.changeChannelforWinnerAndLoser(p1, p2, room);
      histories = this.changeHistoryForWinnerAndLoser(0, histories);
    }
    room.history = histories;
    room.gameObj.gamePhase = GamePhase.FORCE_QUIT;
    setTimeout(() => {
      this.startRendering(room, server, this);
    }, 50);
    return true;
  }
  public findUserIdxProcessedOrNot(userIdx: number): boolean {
    const target = this.processedUserIdxList.find((value) => value === userIdx);
    if (target === undefined) return false;
    return true;
  }

  public popOutProcessedUserIdx(userIdx: number) {
    const targetIdx = this.processedUserIdxList.findIndex(
      (value) => value === userIdx,
    );
    if (targetIdx === -1) return;
    this.processedUserIdxList.splice(targetIdx, 1);
    return;
  }

  public forceQuitForForceDisconnect(userIdx: number, server: Server): boolean {
    return this.forceQuitMatch(userIdx, server);
  }

  //   public checkInviteGameIsReady(option: GameInviteOptionDto): boolean {
  //     const userIdx = option.userIdx;
  //     const target = this.playRoom.find(
  //       (room) =>
  //         room.users[0].getUserObject().userIdx === userIdx ||
  //         room.users[1].getUserObject().userIdx === userIdx,
  //     );
  //     if (target === undefined) return false;
  //     return true;
  //   }

  public makePlayerRoomForInviteGame(option: GameInviteOptionDto): boolean {
    const user = this.inMemoryUsers.getUserByIdFromIM(option.userIdx);
    const targetUser = this.inMemoryUsers.getUserByIdFromIM(option.targetIdx);

    return true;
  }
}
