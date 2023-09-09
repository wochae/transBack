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
    totalDistancePerSec: number
  ) {
    this.roomId = id;
    this.intervalId = null;
	this.intervalPeriod = 0;
    this.users = users;
    this.gameObj = {
  		currentPos: [0,0],
  		anglePos: [0,0],
  		standardPos: [0,0],
  		frameData: [0,0],
  		linearEquation:[0,0],
		vector: Vector.UPRIGHT,
  		paddle1: [0, [0,0]],
		paddle2: [0, [0,0]],
  		score: [0,0],
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

    this.animation = new Animations(totalDistancePerSec);
	this.physics = new Physics()

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
  		currentPos: [0,0],
  		anglePos: [0,0],
  		standardPos: [0,0],
  		frameData: [0,0],
  		linearEquation:[0,0],
		vector: Vector.UPRIGHT,
  		paddle1: [0, [0,0]],
		paddle2: [0, [0,0]],
  		score: [0,0],
  		gamePhase: GamePhase.SET_NEW_GAME,
		gameType: room.gameObj.gameType,
		gameSpeed: room.gameObj.gameSpeed,
		gameMapNumber: room.gameObj.gameMapNumber
    };
	room.setRandomStandardCoordinates();
    // room.animation.setRenewLinearEquation(room.gameObj);
    room.keyPress[0].setRenewKeypress();
    room.keyPress[1].setRenewKeypress();
    // TODO: 애니메이션 객체를 새롭게 만들어야 하는가?
    //
  }

  public setLatency(latency: number, room: GameRoom): number {
	console.log(`target latency -> ${latency}`)
    // room.animation.setMaxFps(latency);
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
	console.log(`MaxFPS? -> ${maxFps}`)

    if (maxFps == 60) room.intervalPeriod = 15;
    else if (maxFps == 30) room.intervalPeriod = 30;
    else if (maxFps == 24) room.intervalPeriod = 40;
    else room.intervalPeriod = 80;
    // TODO: 정상 가동 여부 판단 필요
    room.keyPress.map((data) => data.setPressedNumberByMaxFps(maxFps));
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
    if (this.users[0].getUserObject().userIdx === userIdx) {
      this.keyPress[0].pushKey(value);
    } else if (this.users[1].getUserObject().userIdx === userIdx) {
      this.keyPress[1].pushKey(value);
    }
  }

  //TODO: 
  public getNextFrame(room:GameRoom): FrameData {
	room.animation.makeFrame(room.gameObj);
    room.physics.checkPhysics(room.gameObj);
    return room.makeFrameData(room.gameObj);
  }

  public setRandomStandardCoordinates() {
    this.gameObj.angleX = this.gameObj.standardX = this.getRandomInt(-2, 2);
    this.gameObj.angleY = this.gameObj.standardY = this.getRandomInt(-2, 2);
    let down = true;
    let right = true;

    if (this.gameObj.angleX < 0) right = false;
    if (this.gameObj.angleY < 0) down = false;

    if (right == true && down == true) {
      this.gameObj.vector = Vector.DOWNRIGHT;
    } else if (right == true && down == false) {
      this.gameObj.vector = Vector.UPRIGHT;
    } else if (right == false && down == true) {
      this.gameObj.vector = Vector.DOWNLEFT;
    } else {
      this.gameObj.vector = Vector.UPLEFT;
    }
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
    return this.gamePhase;
  }

  public setGamePhase(value: GamePhase): GamePhase {
    this.gamePhase = value;
    return this.gamePhase;
  }

  public getScoreStatus(): GamePhase {
    return this.gamePhase;
  }

  public getCurrentFrame(): FrameData {
    return this.animation.currentDatas;
  }

  public syncronizeResult() {
    this.channel.score1 = this.gameObj.score1;
    this.channel.score2 = this.gameObj.score2;
    this.history[0].score = `${this.channel.score1} : ${this.channel.score2}`;
    this.history[1].score = `${this.channel.score2} : ${this.channel.score1}`;
    if (this.gamePhase === GamePhase.SET_NEW_GAME) {
      this.channel.status = RecordResult.PLAYING;
    } else {
      this.channel.status = RecordResult.DONE;
    }
  }
}
