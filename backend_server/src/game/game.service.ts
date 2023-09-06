import { Injectable } from '@nestjs/common';
import { GameRecordRepository } from './game.record.repository';
import { GameChannelRepository } from './game.channel.repository';
import { UserObjectRepository } from 'src/users/users.repository';
import { InMemoryUsers } from 'src/users/users.provider';
import { UsersService } from 'src/users/users.service';
import { GamePlayer } from './class/game.player/game.player';
import { GameOptionDto } from './dto/game.option.dto';
import { OnlineStatus } from 'src/entity/users.entity';
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
import { GamePingDto, GamePingReceiveDto } from './dto/game.ping.dto';
import { GamePauseScpreDto } from './dto/game.pause.score.dto';
import { LoggerWithRes } from 'src/shared/class/shared.response.msg/shared.response.msg';

@Injectable()
export class GameService {
  private playRoom: GameRoom[];
  private normalQueue: GameQueue;
  private rankQueue: GameQueue;
  private friendQueue: GameQueue;
  private onLinePlayer: [GamePlayer, GameType][];
  private nameCnt: number;
  private today: string;
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
    this.friendQueue = new GameQueue();
    this.onLinePlayer = [];
    this.nameCnt = 0;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
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

  // player 만들기
  async makePlayer(data: GameOptionDto): Promise<GamePlayer | null> {
    const target = this.inMemoryUsers.getUserByIdFromIM(data.userIdx);
    if (target === undefined) return null;

    const player = new GamePlayer(target);
    player.setOptions(data);
    if (target.isOnline === OnlineStatus.ONLINE)
      target.isOnline = OnlineStatus.ONGAME; //TODO: chat과 연계 버그 확인 필요
    this.inMemoryUsers.saveUserByUserIdFromIM(target.userIdx);
    return player;
  }

  // 큐에 플레이어를 넣어둔다.
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

  // 플레이어가 커넥션이 연결됨에 따라, 소켓을 설정해준다.
  setSocketToPlayer(clientSocket: Socket, userIdx: number): boolean {
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        member[0].setSocket(clientSocket);
        return true;
      }
    }
    return false;
  }

  // 큐 내부를 파악하고, 게임 상대가 준비되었는지 확인한다.
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
    await this.inMemoryUsers.saveUserByUserIdFromIM(userIdx);
  }

  // play room 을 구성한다.
  async makePlayerRoom(players: GamePlayer[], server: Server) {
    const roomName = this.makeRoomName();
    const option = this.setOptions(players);
    const channel = this.makeGameChennl(players);
	console.log("option", option.gameType);
	this.messanger.logWithMessage("makePlayerRoom", "", "", `${players.length}`);
	
    await this.gameChannelRepository.save(channel);
	this.messanger.logWithMessage("makePlayerRoom", "", "", `${channel.userIdx1} ${channel.userIdx2} / ${channel.matchDate}`)
    const gameRecord = await this.makeGameHistory(players, channel);
	// TODO: FIX here
    await this.gameRecordRepository.save(gameRecord[0]).then(async () => {
      await this.gameRecordRepository.save(gameRecord[1]).then(
	async () => {
		const room =  new GameRoom(roomName, players, option.gameType, option.speed, option.mapNumber, await gameRecord, channel);
    	this.playRoom.push(room);
   		 players[0].getSocket().join(roomName);
   		 players[1].getSocket().join(roomName);
    	room.setGamePhase(GamePhase.MAKE_ROOM);
    	server
      .to(roomName)
      .emit(
        'game_queue_succes',
        new GameQueueSuccessDto(channel.gameIdx, players),
      );
	}
   )
    });
    
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
	  matchDate: new Date(),
    });
    return ret;
  }

  // DB 저장을 위한 Record 객체를 생성한다.
  private async makeGameHistory(
    players: GamePlayer[],
    channel: GameChannel,
  ): Promise<GameRecord[]> {
	channel = await this.gameChannelRepository.findOneBy({
		userIdx1: channel.userIdx1,
		userIdx2: channel.userIdx2,
		matchDate: channel.matchDate,
	});
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
    if (room === null) return null;
    if (room.users[0].getUserObject().userIdx.toString() === userIdx.toString())
      room.users[0].setReady(userIdx);
    else room.users[1].setReady(userIdx);
    return room.users[0].getReady() && room.users[1].getReady();
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
        room.users[0].getUserObject().userIdx.toString() === userIdx.toString()
      ) {
        return room.roomId;
      } else if (
        room.users[1].getUserObject().userIdx.toString() === userIdx.toString()
      ) {
        return room.roomId;
      }
    }
  }

  // Room 의 이름으로 룸을 가
  private findGameRoomByRoomId(roomId: string): GameRoom {
    return this.playRoom.find(
      (room) => room.roomId.toString() === roomId.toString(),
    );
  }

  // 1차 핑 보내기 준비하는 용도
  public readyToSendPing(roomId: string, server: Server) {
    const target = this.findGameRoomByRoomId(roomId);
    target.intervalId = setInterval(this.sendPingToRoom, 15, target, server);
  }

  // 실제 초반 레이턴시 확정을 위한 핑 보내는 메서드
  public sendPingToRoom(room: GameRoom, server: Server) {
    server.to(room.roomId).emit('game_ping', new GamePingDto());
  }

  // 핑의 수신 용도
  public receivePing(data: GamePingReceiveDto): boolean {
    const targetRoom = this.findGameRoomById(data.userIdx);
    if (targetRoom.gamePhase != GamePhase.MAKE_ROOM) return false;
    let latencyCnt;
    let latencyIdx;
    if (
      targetRoom.users[0].getUserObject().userIdx.valueOf() ===
      data.userIdx.valueOf()
    )
      latencyIdx = 0;
    else latencyIdx = 1;

    latencyCnt[latencyIdx] += 1;
    if (targetRoom.latency[latencyIdx] == 0) {
      targetRoom.latency[latencyIdx] += data.clientTime - data.serverTime;
    } else {
      targetRoom.latency[latencyIdx] += data.clientTime - data.serverTime;
      targetRoom.latency[latencyIdx] = Math.round(
        targetRoom.latency[latencyIdx] / 2,
      );
    }
    if (latencyCnt == 120) {
      if (targetRoom.latencyCnt[0] >= 120 && targetRoom.latencyCnt[1] >= 120) {
        targetRoom.stopInterval();
        targetRoom.latencyCnt.splice(0, 2);
        targetRoom.latencyCnt.push(0);
        targetRoom.latencyCnt.push(0);
        // TODO: FPS 체크 어디서 되지?
        targetRoom.gamePhase = GamePhase.SET_NEW_GAME;
        return true;
      }
    }

    return false;
  }

  // 받은 핑을 통해 프레임 Max 값을 설정하고, 레이턴시를 지정한다.
  public sendSetFrameRate(userIdx: number): number {
    const targetRoom = this.findGameRoomById(userIdx);
    const targetLatency =
      targetRoom.latency[0] >= targetRoom.latency[1]
        ? targetRoom.latency[0]
        : targetRoom.latency[1];
    return targetRoom.setLatency(targetLatency);
  }

  // 최초 게임 시작시, 여기서 게임이 시작된다.
  public startGame(userIdx: number, server: Server) {
    const targetRoom = this.findGameRoomById(userIdx);
    if (targetRoom.gamePhase != GamePhase.SET_NEW_GAME) return;
    targetRoom.setNewGame();
    targetRoom.setGamePhase(GamePhase.ON_PLAYING);
    targetRoom.setIntervalId(
      setInterval(
        this.makeFrame,
        targetRoom.getIntervalMs(),
        targetRoom,
        server,
      ),
    );
  }

  // 프레임을 전달하는 함수
  private async makeFrame(room: GameRoom, server: Server) {
    room.getNextFrame();
    const status: GamePhase = room.getScoreStatus();
    if (status !== GamePhase.ON_PLAYING) {
      //TODO: frame data
      room.stopInterval();
      if (status === GamePhase.SET_NEW_GAME) {
        // TODO: get Score but not end;
        server
          .to(room.roomId)
          .emit(
            'game_pause_score',
            new GamePauseScpreDto(room.users, room.gameObj, GameStatus.ONGOING),
          );
      } else if (status === GamePhase.MATCH_END) {
        server
          .to(room.roomId)
          .emit(
            'game_pause_score',
            new GamePauseScpreDto(room.users, room.gameObj, GameStatus.END),
          );
        // TODO: get Score and match is end;
      }
      room.syncronizeResult();
      await this.gameChannelRepository.save(room.channel).then(async () => {
        await this.gameRecordRepository.save(room.history[0]).then(async () => {
          await this.gameRecordRepository.save(room.history[1]);
        });
      });
      //TODO: 조건에 맞춰서 바꾸기
    } else {
      server
        .to(room.roomId)
        .emit(
          'game_frame',
          new GamePauseScpreDto(room.users, room.gameObj, GameStatus.ONGOING),
        );
    }
  }
}
