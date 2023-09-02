import { GameRecord } from 'src/entity/gameRecord.entity';
import { UserObject } from 'src/entity/users.entity';
import { GamePlayer } from '../game.player/game.player';
import { GameSpeed, GameType, MapNumber } from 'src/game/enum/game.type.enum';
import { GameOptionDto } from 'src/game/dto/game.option.dto';
import { Vector } from 'src/game/enum/game.vector.enum';

/**
 * 게임 구성요소를 나타내는 용도
 */
export interface GameData {
  currentPosX: number;
  currentPosY: number;
  standardX: number;
  standardY: number;
  angle: number; // y = ax + b, 'a'
  yIntercept: number; // y = ax + b, 'b'
  vector: Vector;
  paddle1: number;
  paddle1MinMax: [number, number];
  paddle2: number;
  paddle2MinMax: [number, number];
  gameType: GameType;
  gameSpeed: GameSpeed;
  gameMapNumber: MapNumber;
  score1: number;
  score2: number;
}

/**
 * 게임의 프레임 데이터 저장용.
 */
export interface FrameData {
  ballX: number;
  ballY: number;
  paddle1: number;
  paddle2: number;
  maxFrameRate: number;
  currentFrame: number;
}

/**
 * 60, 30, 24 프레임 대응을 위해 제작한 enum
 */
export enum Fps {
  FULL = 2,
  HALF = 4,
  LOW = 5,
  SUPERLOW = 12,
  ERROR = 0,
}

/**
 * 키 입력을 받는 클래스. 자체적으로 동작하고, 최종적으로 호출시 키 입력 수준을 결정한다.
 */
export class KeyPress {
  private keyAccumulatedValue: number;
  private maxFrame: number;
  private pressedNumber: Fps;
  private moveUnit: number;

  /**
   *
   * @param latency 최대 프레임을 나타내며, 레이턴시를 고려하여, 프레임을 할당하면 된다. 7 ms 이하인 경우 60 fps, 14ms 이하인 경우 30 fps, 20ms 이하인 경우 24fps로 동작한다. 100ms 이하인 경우에는 특별 케이스로 보간 기법을 활용하면 되어서 구현해본다.
   */
  constructor() {
    this.maxFrame = -1;
    this.pressedNumber = null;
    this.moveUnit = 1;
  }

  public setPressedNumberByMaxFps(maxFps: number): Fps {
    if (maxFps == 60) {
      return Fps.FULL;
    } else if (maxFps == 30) {
      return Fps.HALF;
    } else if (maxFps == 24) {
      return Fps.LOW;
    } else if (maxFps == 10) {
      return Fps.SUPERLOW;
    } else {
      return Fps.ERROR;
    }
  }

  public setMaxUnit(value: number) {
    this.moveUnit = Math.ceil(value / 20);
  }

  public pushKey(value: number) {
    const howManyPushKey = this.pressedNumber.valueOf();
    this.keyAccumulatedValue += value * howManyPushKey;
  }

  public popKeyValue(): number {
    const thresholdLevel = 6;
    const sum = Math.floor(this.keyAccumulatedValue / thresholdLevel);
    this.keyAccumulatedValue -= sum * thresholdLevel;
    return sum * this.moveUnit;
  }
}

class Animations {
  private readonly MAX_WIDTH = 500;
  private readonly min_WIDTH = -500;
  private readonly MAX_HEIGHT = 300;
  private readonly min_HEIGHT = -300;
  private readonly PADDLE_LINE_1 = -470;
  private readonly PADDLE_LINE_2 = 470;

  prevDatas: FrameData;
  currentDatas: FrameData;
  maxFps: number;
  currentFps: number;
  totalDistancePerSec: number;
  unitDistance: number;

  constructor() {
    this.prevDatas = null;
    this.currentDatas = null;
    this.maxFps = null;
    this.currentFps = 0;
    this.totalDistancePerSec = 150;
  }

  public setMaxFps(latency: number) {
    if (latency < 8) {
      this.maxFps = 60;
    } else if (latency >= 8 && latency < 15) {
      this.maxFps = 30;
    } else if (latency >= 15 && latency < 20) {
      this.maxFps = 24;
    } else if (latency >= 20 && latency < 50) {
      this.maxFps = 10;
    }
    this.unitDistance = parseFloat(
      (this.totalDistancePerSec / this.maxFps).toFixed(2),
    );
  }

  public getMaxFps(): number {
    return this.maxFps;
  }

  public makeFrame(currentData: GameData, key: KeyPress[]) {
    // 기존 데이터 이관
    if (this.currentDatas != null) {
      this.prevDatas = this.currentDatas;
      this.currentDatas = null;
    }

    // 좌표 계산
    const nextX = parseFloat(
      (currentData.currentPosX + this.unitDistance).toFixed(2),
    );
    const nextY = parseFloat(
      (currentData.angle * nextX + currentData.yIntercept).toFixed(2),
    );

    // 페들 데이터 바꿈
    const paddle1 = currentData.paddle1 + key[0].popKeyValue();
    const paddle2 = currentData.paddle2 + key[1].popKeyValue();

    // 프레임 값 갱신
    currentData.currentPosX = nextX;
    currentData.currentPosY = nextY;
    currentData.paddle1 = paddle1;
    currentData.paddle2 = paddle2;

    // 프레임 값 갱신 #2 paddle 최대, 최소 값 정리
    currentData.paddle1MinMax = [
      (currentData.paddle1MinMax[0] += paddle1),
      (currentData.paddle1MinMax[1] += paddle1),
    ];
    if (currentData.paddle1 > 0) {
      // 패들 좌표 수정
      if (currentData.paddle1MinMax[0] >= this.MAX_HEIGHT) {
        currentData.paddle1 = this.MAX_HEIGHT - 20;
        currentData.paddle1MinMax[0] = this.MAX_HEIGHT;
        currentData.paddle1MinMax[1] = this.MAX_HEIGHT - 20;
      }
    } else {
      if (currentData.paddle1MinMax[1] <= this.MAX_HEIGHT) {
        currentData.paddle1 = this.min_HEIGHT + 20;
        currentData.paddle1MinMax[0] = this.min_HEIGHT + 20;
        currentData.paddle1MinMax[1] = this.min_HEIGHT;
      }
    }
    currentData.paddle2MinMax = [
      (currentData.paddle2MinMax[0] += paddle1),
      (currentData.paddle2MinMax[1] += paddle1),
    ];
    if (currentData.paddle2 > 0) {
      // 패들 좌표 수정
      if (currentData.paddle2MinMax[0] >= this.MAX_HEIGHT) {
        currentData.paddle2 = this.MAX_HEIGHT - 20;
        currentData.paddle2MinMax[0] = this.MAX_HEIGHT;
        currentData.paddle2MinMax[1] = this.MAX_HEIGHT - 20;
      }
    } else {
      if (currentData.paddle2MinMax[1] <= this.MAX_HEIGHT) {
        currentData.paddle2 = this.min_HEIGHT + 20;
        currentData.paddle2MinMax[0] = this.min_HEIGHT + 20;
        currentData.paddle2MinMax[1] = this.min_HEIGHT;
      }
    }

    // 현재 게임 상태 갱신
    if (this.currentFps + 1 == this.maxFps || this.currentFps + 1 < this.maxFps)
      this.currentFps = 1;
    else {
      this.currentFps++;
    }
    this.currentDatas = {
      ballX: nextX,
      ballY: nextY,
      paddle1: paddle1,
      paddle2: paddle2,
      currentFrame: this.currentFps,
      maxFrameRate: this.maxFps,
    };
  }

  public checkWallStrike(currentData: GameData): boolean {
    switch (currentData.vector) {
      case Vector.UPLEFT:
        if (currentData.currentPosY + 20 >= this.MAX_HEIGHT) {
          currentData.currentPosY = 280;
          return true;
        }
        break;
      case Vector.UPRIGHT:
        break;
      case Vector.DWONLEFT:
        break;
      case Vector.DOWNRIGHT:
        break;
    }

    return false;
  }

  public changeVector() {}
}

export enum GamePhase {
  MAKE_ROOM = 0,
  SET_NEW_GAME,
  ON_PLAYING,
  HIT_THE_WALL,
  HIT_THE_PADDLE,
  HIT_THE_GOAL_POST,
  PAUSE_PLAYING,
  MATCH_END,
  RESULT_SAVED,
}

/**
 * 연산의 핵심. 간단한 데이터를 제외하곤 여기서 연산이 이루어 진다.
 */
export class GameRoom {
  roomId: string;
  intervalId: any;
  intervalPeriod: number;
  users: GamePlayer[];
  gameObj: GameData;
  latency: number[];
  animation: Animations;
  keyPress: KeyPress[];
  history: GameRecord[];
  gamePhase: GamePhase;

  constructor(
    id: string,
    users: GamePlayer[],
    options: GameOptionDto,
    histories: GameRecord[],
  ) {
    this.roomId = id;

    this.users = users;

    this.gameObj.gameType = options.gameType;
    this.gameObj.gameSpeed = options.speed;
    this.gameObj.gameMapNumber = options.mapNumber;
    this.gameObj.score1 = 0;
    this.gameObj.score2 = 0;
    this.gameObj.paddle1MinMax = [20, 20];
    this.gameObj.paddle2MinMax = [20, 20];

    this.animation = new Animations();

    this.keyPress[0] = new KeyPress();
    this.keyPress[1] = new KeyPress();

    this.history = histories;

    this.keyPress.map((item) => item.setMaxUnit(100));

    this.gamePhase = GamePhase.MAKE_ROOM;
  }

  public setNewGame() {
    this.gamePhase = GamePhase.SET_NEW_GAME;
    this.resetBall();
    this.resetPaddle();
    this.setRandomStandardCoordinates();
    this.setNewLinearEquation();
  }

  public resetBall() {
    this.gameObj.currentPosX = 0;
    this.gameObj.currentPosY = 0;
  }

  public resetPaddle() {
    this.gameObj.paddle1 = 0;
    this.gameObj.paddle2 = 0;
  }

  public setLatency(value: number) {
    // TODO logic
    this.animation.setMaxFps(value);
    const maxFps = this.animation.getMaxFps();
    if (maxFps == 60) this.intervalPeriod = 15;
    else if (maxFps == 30) this.intervalPeriod = 30;
    else if (maxFps == 24) this.intervalPeriod = 40;
    else this.intervalPeriod = 50;
    this.keyPress.map((data) => data.setPressedNumberByMaxFps(maxFps));
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

  public keyPressed(userIdx: number, value: number) {
    if (this.users[0].getUserObject().userIdx === userIdx) {
      this.keyPress[0].pushKey(value);
    } else if (this.users[1].getUserObject().userIdx === userIdx) {
      this.keyPress[1].pushKey(value);
    }
  }

  public getNextFrame() {
    this.animation.makeFrame(this.gameObj, this.keyPress);
    return this.animation.currentDatas;
  }

  public setRandomStandardCoordinates() {
    this.gameObj.currentPosX = 0;
    this.gameObj.currentPosY = 0;
    this.gameObj.standardX = this.getRandomInt(-2, 2);
    this.gameObj.standardY = this.getRandomInt(-2, 2);
    let up = true;
    let right = true;
    this.gameObj.vector = null;

    if (this.gameObj.standardX < 0) right = false;
    if (this.gameObj.standardY < 0) up = false;

    if (right == true && up == true) {
      this.gameObj.vector = Vector.UPRIGHT;
    } else if (right == true && up == false) {
      this.gameObj.vector = Vector.DOWNRIGHT;
    } else if (right == false && up == true) {
      this.gameObj.vector = Vector.UPLEFT;
    } else {
      this.gameObj.vector = Vector.DWONLEFT;
    }
  }

  public setNewLinearEquation() {
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
}
