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
import { GameFrameDataDto } from './dto/game.frame.data.dto';
import { KeyPressDto } from './dto/key.press.dto';
import { GameResultDto } from './dto/game.result.dto';

@Injectable()
export class GameService {
  private playRoom: GameRoom[];
  private normalQueue: GameQueue;
  private rankQueue: GameQueue;
  private friendQueue: GameQueue;
  private onLinePlayer: [GamePlayer, GameType][];
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
    this.friendQueue = new GameQueue();
    this.onLinePlayer = [];
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
    const getPerson = this.inMemoryUsers.getUserByIdFromIM(data.userIdx);
    if (getPerson === undefined) return null;

    const player = new GamePlayer(getPerson);
    player.setOptions(data);
    if (getPerson.isOnline === OnlineStatus.ONLINE)
      getPerson.isOnline = OnlineStatus.ONGAME; //TODO: chat과 연계 버그 확인 필요
    const target = await this.inMemoryUsers.saveUserByUserIdFromIM(
      getPerson.userIdx,
    );
    if (target === null) return null;
    player.setUserObject(target);
    return player;
  }

  // 큐에 플레이어를 넣어둔다.
  putInQueue(player: GamePlayer) {
    const type = player.getOption().gameType;
    this.onLinePlayer.push([player, player.getOption().gameType]);
    switch (type) {
      case GameType.FRIEND:
        this.friendQueue.pushPlayer(player);
        break;
      case GameType.NORMAL:
        this.normalQueue.pushPlayer(player);
        break;
      case GameType.RANK:
        this.rankQueue.pushPlayer(player);
        break;
    }
  }

  // 플레이어가 커넥션이 연결됨에 따라, 소켓을 설정해준다.
  setSocketToPlayer(clientSocket: Socket, userIdx: number): boolean {
	console.log("setSocketToPlayer here start");
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        member[0].setSocket(clientSocket);
		console.log("setSocketToPlayer here end");
        return true;
      }
    }
    return false;
  }

  // 큐 내부를 파악하고, 게임 상대가 준비되었는지 확인한다.
  checkQueue(userIdx: number): GamePlayer[] {
	// console.log(`userIdx 확인 전 : ` + userIdx)
    let target: [GamePlayer, GameType];
    for (const member of this.onLinePlayer) {
      if (member[0].getUserObject().userIdx === userIdx) {
        target = member;
        break;
      }
    }
	// console.log(`UserIdx 확인 후` + target[0].getUserObject().userIdx)
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
	  console.log("here it is!!!");
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
  async makePlayerRoom(players: GamePlayer[], server: Server) {
    const roomName = this.makeRoomName();
	this.messanger.logWithMessage(
      'makePlayerRoom',
      '',
      '',
      `${roomName}`,
    );

    const option = this.setOptions(players);
	this.messanger.logWithMessage(
      'makePlayerRoom',
      '',
      '',
      `${option.userIdx}`,
    );

    let channel = this.makeGameChannel(players);
    this.messanger.logWithMessage(
      'makePlayerRoom',
      '',
      '',
      `${players.length}`,
    );

    const newChannel = await this.gameChannelRepository.save(channel)
    this.messanger.logWithMessage(
        'makePlayerRoom',
        '',
        '',
        `${channel.userIdx1} ${channel.userIdx2} / ${channel.matchDate}`,);
   

	const gameRecord = this.makeGameHistory(players, newChannel);
      // TODO: FIX here
    let record0 = await this.gameRecordRepository.save(gameRecord[0]);
	let record1 = await this.gameRecordRepository.save(gameRecord[1]);
	(await gameRecord).splice(0, 2);
	(await gameRecord).push(record0);
	(await gameRecord).push(record1);
	const room = new GameRoom(roomName, players, option.gameType, option.speed, option.mapNumber,
            await gameRecord, channel);
	// room.sockets = [];
	// room.sockets.push(players[0].getSocket());
	// room.sockets.push(players[1].getSocket());
	// room.server = server;
	// room.sockets[0].leave('default');
	// room.sockets[1].leave('default');
	// room.sockets[0].join(room.roomId);
	// room.sockets[1].join(room.roomId);
    //  console.log(`현재 방 개수 : ` + this.playRoom.push(room));
	
	players[0].getSocket().join(roomName);
	players[1].getSocket().join(roomName);
	this.playRoom.push(room);
	room.setGamePhase(GamePhase.MAKE_ROOM);
	// setTimeout(() => {
	// 	server.to(roomName).emit('game_queue_success', new GameQueueSuccessDto(channel.gameIdx, players))
	// },500);
	
	const data = new GameQueueSuccessDto(channel.gameIdx, players, room.gameObj.gameType, room.gameObj.gameSpeed, room.gameObj.gameMapNumber );
	setTimeout(() => {server.to(room.roomId).emit('game_queue_success', data)}, 500);
	// console.log('server', server);
	// console.log('------------------------')
	// this.messanger.logWithMessage("makePlyerRoom", "", "" ,"server emit to room");
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
    console.log('room', room)
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
		if (this.playRoom[i].roomId.valueOf() === roomId.valueOf()){
			target = this.playRoom[i]; 
			break;
		}
	}
	return target;
  }

  // 1차 핑 보내기 준비하는 용도
//   public readyToSendPing(roomId: string, server: Server, gameService: GameService) {
//     // const target = this.findGameRoomByRoomId(roomId);
// 	console.log(roomId);
// 	gameService.messanger.logWithMessage("ready to send ping", "", "", `room Id : ${roomId}`);
// 	gameService.messanger.logWithMessage("ready to send ping", "", "", `room length : ${gameService.playRoom.length}`);
	
// 	let target;
// 	for(let i = 0; i < gameService.playRoom.length; i++) {
// 		if (gameService.playRoom[i].roomId.valueOf === roomId.valueOf) {
// 			target = gameService.playRoom[i];
// 			break ;
// 		}
// 	}

// 	// const target = gameService.playRoom.find(
//     //   (room) => {room.roomId.valueOf() === roomId.valueOf()}
//     // );
//     target.intervalId = setInterval(()=> {gameService.sendPingToRoom(target, server)}, 1000);
//   }

	public readyToSendPing(roomId: string, server: Server) {
    // const target = this.findGameRoomByRoomId(roomId);
	// console.log(roomId);
	// this.messanger.logWithMessage("ready to send ping", "", "", `room Id : ${roomId}`);
	// this.messanger.logWithMessage("ready to send ping", "", "", `room length : ${this.playRoom.length}`);
	
	let target;
	for(let i = 0; i < this.playRoom.length; i++) {
		if (this.playRoom[i].roomId.valueOf === roomId.valueOf) {
			target = this.playRoom[i];
			break ;
		}
	}
//   console.log('readyto', server.sockets)

	// const target = this.playRoom.find(
    //   (room) => {room.roomId.valueOf() === roomId.valueOf()}
    // );
    target.intervalId = setInterval(()=> { this.sendPingToRoom(target, server)}, 1000);
  }

  // 실제 초반 레이턴시 확정을 위한 핑 보내는 메서드
  public sendPingToRoom(room: GameRoom, server: Server) {
	// console.log(room.users[0].getSocket().id);
	// console.log(room.users[1].getSocket().id);
	// room.users[0].getSocket().leave(room.roomId);
	// room.users[1].getSocket().leave(room.roomId);
	// room.users[0].getSocket().join(room.roomId);
	// room.users[1].getSocket().join(room.roomId);
	
	const target = new GamePingDto();
	// room.sockets[0].emit('game_ping', target);
	// room.sockets[1].emit('game_ping', target);
//   console.log('sendPingToRoom', room, server.sockets);
  server.to(room.roomId).emit('game_ping', target);
  // console.log('room', room);
  // console.log('------------------------')
  // console.log('server', server.sockets);
  // console.log('------------------------')

	
	// room.users[0].getSocket().emit('game_ping', new GamePingDto(room.users[0].getUserObject().userIdx));
	// setTimeout(() => {room.users[1].getSocket().emit('game_ping', new GamePingDto(room.users[1].getUserObject().userIdx))}, 100);
  }

  // 핑의 수신 용도
  public receivePing(userIdx: number, latency: number): boolean {
	// this.messanger.logWithMessage("receive ping", "" , "" , "start here");
    const targetRoom = this.findGameRoomById(userIdx);
	// this.messanger.logWithMessage("receive ping", "" , "" , `targetRoom : ${targetRoom.roomId}`);
	// this.messanger.logWithMessage("receive ping", "" , "" , `targetRoom : ${targetRoom.gamePhase}`);

    if (targetRoom.gamePhase !== GamePhase.MAKE_ROOM) return false;
    let latencyIdx;
	// this.messanger.logWithMessage("receive ping", "" , "" , `user : ${targetRoom.users[0].getUserObject().userIdx}`);
	// this.messanger.logWithMessage("receive ping", "" , "" , `user : ${targetRoom.users[1].getUserObject().userIdx}`);
	// this.messanger.logWithMessage("receive ping", "" , "" , `data user : ${data.userIdx}`);
    if (targetRoom.users[0].getUserObject().userIdx === userIdx)
      latencyIdx = 0;
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
	  console.log(`targetRoom latency : ${targetRoom.latency[latencyIdx]}`);
    }
	// TODO: Lateyncy cnt to change
    if (targetRoom.latencyCnt[latencyIdx] === 3) {
      if (targetRoom.latencyCnt[0] >= 3 && targetRoom.latencyCnt[1] >= 3) {
        targetRoom.stopInterval();
        this.sendSetFrameRate(userIdx);
        targetRoom.latencyCnt.splice(0, 2);
        targetRoom.latencyCnt.push(0);
        targetRoom.latencyCnt.push(0);
        targetRoom.gamePhase = GamePhase.SET_NEW_GAME;
        return true;
      }
    }
    return false;
  }

  public checkLatencyOnPlay(target: GameRoom, keyData: KeyPressDto) {
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
        this.sendSetFrameRate(keyData.userIdx);
        target.latencyCnt.splice(0, 2);
        target.latencyCnt.push(0);
        target.latencyCnt.push(0);
        // target.gamePhase = GamePhase.SET_NEW_GAME;
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
  public startGame(userIdx: number, server: Server, gameService: GameService) {
	let targetRoom: GameRoom;
	for (const room of gameService.playRoom) {
      if (room.users[0].getUserObject().userIdx === userIdx) {
        targetRoom = room;
		break ;
      } else if (room.users[1].getUserObject().userIdx === userIdx) {
        targetRoom = room;
		break ;
      }
    }
    if (targetRoom.gamePhase != GamePhase.SET_NEW_GAME) return;
    targetRoom.setNewGame(targetRoom);
    targetRoom.setGamePhase(GamePhase.ON_PLAYING);
	console.log(`target Interval Ms : ${targetRoom.getIntervalMs()}`)
    targetRoom.setIntervalId(
      setInterval(() => {
        gameService.makeFrame(targetRoom, server, gameService)},targetRoom.getIntervalMs()
      ),
    );
  }

  // 프레임을 전달하는 함수
  private async makeFrame(room: GameRoom, server: Server, gameService: GameService) {
    const frame = room.getNextFrame(room);
	// console.log(`frame data : ${frame}`);
    const status: GamePhase = room.getScoreStatus();
    if (status === GamePhase.SET_NEW_GAME || status === GamePhase.MATCH_END) {
      room.stopInterval();
      if (status === GamePhase.SET_NEW_GAME) {
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
      }
      room.syncronizeResult();
      await this.gameChannelRepository.save(room.channel).then(async () => {
        await this.gameRecordRepository.save(room.history[0]).then(async () => {
          await this.gameRecordRepository
            .save(room.history[1])
            .then(async () => {
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
              } else {
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
              await this.inMemoryUsers.saveUserByUserIdFromIM(user1.userIdx);
              await this.inMemoryUsers.saveUserByUserIdFromIM(user2.userIdx);
            });
        });
      });
    } else {
		gameService.frameData.setData(frame, Date.now());
      server
        .to(room.roomId)
        .emit('game_frame',gameService.frameData );
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
}
