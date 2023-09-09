import { GameRecord } from 'src/entity/gameRecord.entity';
import { UserObject } from 'src/entity/users.entity';
import { GamePlayer } from '../game.player/game.player';
import { GameSpeed, GameType, MapNumber } from 'src/game/enum/game.type.enum';
import { GameOptionDto } from 'src/game/dto/game.option.dto';
import { Vector } from 'src/game/enum/game.vector.enum';
import { GameChannel } from 'src/entity/gameChannel.entity';
import { GameData } from 'src/game/enum/game.data.enum';
import { FrameData, Fps } from 'src/game/enum/frame.data.enum';
import { KeyPress } from 'src/game/class/key.press/key.press';
import { Animations } from 'src/game/class/animation/animation';
import { GamePhase } from 'src/game/enum/game.phase';
import { RecordResult } from 'src/game/enum/game.type.enum';
import { Socket, Server } from 'socket.io';
import { Physics } from '../physics/physics';
import { max } from 'class-validator';
/**
 * 연산의 핵심. 간단한 데이터를 제외하곤 여기서 연산이 이루어 진다.
 */
export class GameRoom {
  roomId: string;
  intervalId: any;
  intervalPeriod: number; // 서버 -(좌표)-> 클라이언트 -(키 입력)-> 서버  -(좌표, 키 입력)-> 클라이언트
  users: GamePlayer[];
  gameObj: GameData;
  latency: number[];
  latencyCnt: number[];
  animation: Animations;
  physics: Physics;
  keyPress: KeyPress[];
  history: GameRecord[];
  channel: GameChannel;

  constructor(
    id: string,
    users: GamePlayer[],
    type: GameType,
    speed: GameSpeed,
    mapNumber: MapNumber,
    histories: GameRecord[],
    channel: GameChannel,
    totalDistancePerSec: number,
  ) {
    this.roomId = id;
    this.intervalId = null;
    this.intervalPeriod = 0;
    this.users = users;
    this.gameObj = {
      currentPos: [0, 0],
      anglePos: [0, 0],
      standardPos: [0, 0],
      frameData: [0, 0],
      linearEquation: [0, 0],
      vector: Vector.UPRIGHT,
      paddle1: [0, [-40, 40]],
      paddle2: [0, [-40, 40]],
      score: [0, 0],
      gamePhase: GamePhase.SET_NEW_GAME,
      gameType: type,
      gameSpeed: speed,
      gameMapNumber: mapNumber,
    };

    this.latency = [];
    this.latency.push(0);
    this.latency.push(0);

    this.latencyCnt = [];
    this.latencyCnt.push(0);
    this.latencyCnt.push(0);

    this.animation = new Animations();
    this.physics = new Physics();

    this.keyPress = [];
    this.keyPress[0] = new KeyPress();
    this.keyPress[1] = new KeyPress();

    this.history = histories;
    this.channel = channel;

    this.keyPress.map((item) => item.setMaxUnit(totalDistancePerSec));
  }

  // 게임을 초기화한다.
  public setNewGame(room: GameRoom) {
    room.gameObj = {
      currentPos: [0, 0],
      anglePos: [0, 0],
      standardPos: [0, 0],
      frameData: [0, 0],
      linearEquation: [0, 0],
      vector: Vector.UPRIGHT,
      paddle1: [0, [-40, 40]],
      paddle2: [0, [-40, 40]],
      score: [0, 0],
      gamePhase: GamePhase.SET_NEW_GAME,
      gameType: room.gameObj.gameType,
      gameSpeed: room.gameObj.gameSpeed,
      gameMapNumber: room.gameObj.gameMapNumber,
    };
    room.setRandomStandardCoordinates();
    // room.animation.setRenewLinearEquation(room.gameObj);
    room.keyPress[0].setRenewKeypress();
    room.keyPress[1].setRenewKeypress();
  }

  public setLatency(latency: number, room: GameRoom): number {
    console.log(`target latency -> ${latency}`);
    let maxFps;
    if (latency < 8) {
      maxFps = 60;
    } else if (latency >= 8 && latency < 15) {
      maxFps = 30;
    } else if (latency >= 15 && latency < 20) {
      maxFps = 24;
    } else if (latency >= 20) {
      maxFps = 10;
    }
    room.gameObj.frameData[1] = maxFps;
	room.animation.setUnitDistance(maxFps);
    console.log(`MaxFPS? -> ${maxFps}`);
    if (maxFps == 60) room.intervalPeriod = 15;
    else if (maxFps == 30) room.intervalPeriod = 30;
    else if (maxFps == 24) room.intervalPeriod = 40;
    else room.intervalPeriod = 80;
	room.keyPress[0].setPressedNumberByMaxFps(maxFps);
	room.keyPress[1].setPressedNumberByMaxFps(maxFps);
    return maxFps;
  }

  public setIntervalId(id: any) {
    this.intervalId = id;
  }

  public getIntervalId(): any {
    return this.intervalId;
  }

  public stopInterval() {
    clearInterval(this.intervalId);
  }

  public getMaxFps(): number {
    return this.gameObj.frameData[1];
  }

  public getIntervalMs(): number {
    return this.intervalPeriod;
  }

  public keyPressed(userIdx: number, value: number) {
	console.log(`key pressed by : ${userIdx}`);
    if (this.users[0].getUserObject().userIdx === userIdx) {
      this.keyPress[0].pushKey(value);
	  console.log(`key value : ${this.keyPress[0].getHowManyKey()}`);
    } else if (this.users[1].getUserObject().userIdx === userIdx) {
      this.keyPress[1].pushKey(value);
	  console.log(`key value : ${this.keyPress[1].getHowManyKey()}`);
    }
  }

  public makeNextFrame(room: GameRoom) {
    room.gameObj = room.animation.makeFrame(room, room.keyPress);
    room.gameObj = room.physics.checkPhysics(room.gameObj, room.physics);
	room.gameObj = room.checkScore(room.gameObj);
  }

  public checkScore(gameData: GameData): GameData {
	if (gameData.gamePhase === GamePhase.HIT_THE_GOAL_POST) {
	  if (gameData.score[0] === 5 || gameData.score[1] === 5) {
		gameData.gamePhase = GamePhase.MATCH_END;
	  } else {
		gameData.gamePhase = GamePhase.SET_NEW_GAME;
	  }
	} else {
		gameData.gamePhase = GamePhase.ON_PLAYING;
	}
	return gameData;
  }

  public getChannel(): GameChannel {
    return this.channel;
  }

  public getHistories(): GameRecord[] {
    return this.history;
  }

  public getGameData(): GameData {
    return this.gameObj;
  }

  public setRandomStandardCoordinates() {
    this.gameObj.anglePos = [
      this.getRandomInt(-2, 2),
      this.getRandomInt(-2, 2),
    ];
    let down = true;
    let right = true;

    if (this.gameObj.anglePos[0] < 0) right = false;
    if (this.gameObj.anglePos[1] < 0) down = false;

    this.gameObj.standardPos[0] = this.gameObj.anglePos[0];
    this.gameObj.standardPos[1] = this.gameObj.anglePos[1];

    if (right == true && down == true) {
      this.gameObj.vector = Vector.DOWNRIGHT;
    } else if (right == true && down == false) {
      this.gameObj.vector = Vector.UPRIGHT;
    } else if (right == false && down == true) {
      this.gameObj.vector = Vector.DOWNLEFT;
    } else {
      this.gameObj.vector = Vector.UPLEFT;
    }

    this.gameObj.linearEquation[0] =
      (this.gameObj.standardPos[1] - this.gameObj.currentPos[1]) /
      (this.gameObj.standardPos[0] - this.gameObj.currentPos[0]);
    this.gameObj.linearEquation[1] =
      this.gameObj.standardPos[1] -
      this.gameObj.linearEquation[0] * this.gameObj.currentPos[0];
  }

  //   public setRenewLinearEquation(room: GameRoom) {
  //     this.gameObj.angle =
  //       (this.gameObj.standardY - 0) / (this.gameObj.standardX - 0);
  //     this.gameObj.yIntercept =
  //       this.gameObj.standardY - this.gameObj.angle * 0;
  //   }

  public getRandomInt(min: number, max: number): number {
    let randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    if (randomValue == 0) randomValue = 1;
    return randomValue;
  }

  public getGamePhase(): GamePhase {
    return this.gameObj.gamePhase;
  }

  public setGamePhase(value: GamePhase) {
    this.gameObj.gamePhase = value;
  }

  public deleteRoom() {
    this.roomId = undefined;
    this.intervalId = undefined;
    this.intervalPeriod = undefined; // 서버 -(좌표)-> 클라이언트 -(키 입력)-> 서버  -(좌표, 키 입력)-> 클라이언트
    this.users[0].getSocket().disconnect(true);
    this.users[0].setSocket(undefined);
    this.users[1].getSocket().disconnect(true);
    this.users[1].setSocket(undefined);
    this.users[0].setUserObject(undefined);
    this.users[1].setUserObject(undefined);
    this.gameObj = undefined;
    this.latency = undefined;
    this.latencyCnt = undefined;
    delete this.animation;
    delete this.physics;
    delete this.keyPress[0];
    delete this.keyPress[1];
    this.keyPress = undefined;
    this.history[0] = undefined;
    this.history[1] = undefined;
    this.channel = undefined;
  }
}
