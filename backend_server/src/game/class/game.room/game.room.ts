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
/**
 * 연산의 핵심. 간단한 데이터를 제외하곤 여기서 연산이 이루어 진다.
 */
export class GameRoom {
  roomId: string;
  intervalId: any;
  intervalPeriod: number; // 서버 -(좌표)-> 클라이언트 -(키 입력)-> 서버  -(좌표, 키 입력)-> 클라이언트
  users: GamePlayer[];
  sockets: Socket[];
  server: Server;
  gameObj: GameData;
  latency: number[];
  latencyCnt: number[];
  animation: Animations;
  keyPress: KeyPress[];
  history: GameRecord[];
  channel: GameChannel;
  gamePhase: GamePhase;

  constructor(
    id: string,
    users: GamePlayer[],
    type: GameType,
    speed: GameSpeed,
    mapNumber: MapNumber,
    histories: GameRecord[],
    channel: GameChannel,
  ) {
    this.roomId = id;

    this.users = users;
    this.gameObj = {
      currentPosX: 0,
      currentPosY: 0,
      standardX: 0,
      standardY: 0,
	  currentFrame: 0,
	  maxFrame: 0,
      angle: 0,
      yIntercept: 0,
      vector: Vector.UPRIGHT,
      paddle1: 0,
      paddle1MaxMin: [20, -20],
      paddle2: 0,
      paddle2MaxMin: [20, -20],
      gameType: type,
      gameSpeed: speed,
      gameMapNumber: mapNumber,
      score1: 0,
      score2: 2,
    };

    this.latency = [];
    this.latency.push(0);
    this.latency.push(0);
    this.latencyCnt = [];
    this.latencyCnt.push(0);
    this.latencyCnt.push(0);

    this.animation = new Animations();

    this.keyPress = [];
    this.keyPress[0] = new KeyPress();
    this.keyPress[1] = new KeyPress();

    this.history = histories;
    this.channel = channel;

    this.keyPress.map((item) => item.setMaxUnit(100));

    this.gamePhase = GamePhase.MAKE_ROOM;
  }

  // 게임을 초기화한다.
  public setNewGame(room: GameRoom) {
    room.resetBall();
    room.gameObj.standardX = 0;
    room.gameObj.standardY = 0;
    room.gameObj.currentFrame = 0;
	room.gameObj.maxFrame = 0;
    room.gameObj.angle = 0;
    room.gameObj.yIntercept = 0;
    room.gameObj.vector = Vector.UPRIGHT;
    room.gameObj.paddle1 = 0;
    room.gameObj.paddle1MaxMin = [20, -20];
    room.gameObj.paddle2 = 0;
    room.gameObj.paddle2MaxMin = [20, -20];
    room.gameObj.score1 = 0;
    room.gameObj.score2 = 2;
    room.gamePhase = GamePhase.SET_NEW_GAME;
	room.setRandomStandardCoordinates();
    room.setNewLinearEquation(room);
    room.keyPress[0].setRenewKeypress();
    room.keyPress[1].setRenewKeypress();
    // TODO: 애니메이션 객체를 새롭게 만들어야 하는가?
    //
  }

  public resetBall() {
    this.gameObj.currentPosX = 0;
    this.gameObj.currentPosY = 0;
  }

  public resetPaddle() {
    this.gameObj.paddle1 = 0;
    this.gameObj.paddle2 = 0;
  }

  public setLatency(latency: number): number {
    this.animation.setMaxFps(latency);
    const maxFps = this.animation.getMaxFps();
	this.gameObj.maxFrame = maxFps;
    if (maxFps == 60) this.intervalPeriod = 15;
    else if (maxFps == 30) this.intervalPeriod = 30;
    else if (maxFps == 24) this.intervalPeriod = 40;
    else this.intervalPeriod = 80;
    // TODO: 정상 가동 여부 판단 필요
    this.keyPress.map((data) => data.setPressedNumberByMaxFps(maxFps));
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
    if (this.animation.maxFps === null) return -1;
    return this.animation.maxFps;
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

  public getNextFrame(room:GameRoom): FrameData {
    room.gamePhase = room.animation.makeFrame(room.gameObj, room.keyPress, room);
		room.animation.currentDatas.ballX = room.gameObj.currentPosX;
	room.animation.currentDatas.ballY = room.gameObj.currentPosY;
	room.animation.currentDatas.paddle1 = room.gameObj.paddle1;
	room.animation.currentDatas.paddle2 = room.gameObj.paddle2;
	room.animation.currentDatas.currentFrame = room.gameObj.currentFrame;
	room.animation.currentDatas.maxFrameRate = room.gameObj.maxFrame;
	console.log(`Ball - x : ${room.animation.currentDatas.ballX}`);
	console.log(`Ball - Y : ${room.animation.currentDatas.ballY}`);
	console.log(`FPS: ${room.animation.currentDatas.currentFrame}/ ${room.animation.currentDatas.maxFrameRate}`)
	console.log(`paddle 1 : ${room.animation.currentDatas.paddle1}`);
	console.log(`paddle 1 Max - min : ${room.gameObj.paddle1MaxMin}`);
	console.log(`paddle 2 : ${room.animation.currentDatas.paddle2}`);
	console.log(`paddle 2 Max - min : ${room.gameObj.paddle2MaxMin}`);
	console.log(`standard X : ${room.gameObj.standardX}`);
	console.log(`standard Y : ${room.gameObj.standardY}`);
	console.log(`y intecept : ${room.gameObj.yIntercept}`);
	console.log(`equation angle : ${room.gameObj.angle}`);
    return room.animation.currentDatas;
  }

  public setRandomStandardCoordinates() {
    this.gameObj.currentPosX = 0;
    this.gameObj.currentPosY = 0;
    this.gameObj.standardX = this.getRandomInt(-2, 2);
    this.gameObj.standardY = this.getRandomInt(-2, 2);
    let up = false;
    let right = true;

    if (this.gameObj.standardX < 0) right = false;
    if (this.gameObj.standardY < 0) up = true;

    if (right == true && up == true) {
      this.gameObj.vector = Vector.UPLEFT;
    } else if (right == true && up == false) {
      this.gameObj.vector = Vector.DOWNLEFT;
    } else if (right == false && up == true) {
      this.gameObj.vector = Vector.UPRIGHT;
    } else {
      this.gameObj.vector = Vector.DOWNRIGHT;
    }
  }

  public setNewLinearEquation(room: GameRoom) {
    this.gameObj.angle =
      (this.gameObj.standardY - 0) / (this.gameObj.standardX - 0);
    this.gameObj.yIntercept =
      this.gameObj.standardY - this.gameObj.angle * this.gameObj.standardX;
  }

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
