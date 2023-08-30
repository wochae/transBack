import { GameRecord } from 'src/entity/gameRecord.entity';
import { UserObject } from 'src/entity/users.entity';
import { GamePlayer } from '../game.player/game.player';
import { lstat } from 'fs';
import { GameSpeed, GameType, MapNumber } from 'src/game/enum/game.type.enum';
import { GameOptionDto } from 'src/game/dto/game.option.dto';
import { UserDto } from 'src/users/dto/user.dto';

/**
 * 게임 구성요소를 나타내는 용도
 */
export interface GameData {
  currentPosX: number;
  currentPosY: number;
  standardX: number;
  standardY: number;
  angle: number;
  yIntercept: number;
  paddle1: number;
  paddle2: number;
  gameType: GameType;
  gameSpeed: GameSpeed;
  gameMapNumber: MapNumber;
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
  prevDatas: FrameData;
  currentDatas: FrameData;
  maxFps: number;

  constructor() {
    this.prevDatas = null;
    this.currentDatas = null;
    this.maxFps = null;
  }

  public setMaxFps(latency: number) {
    if (latency < 8) {
      this.maxFps = 60;
      return;
    } else if (latency < 15) {
      this.maxFps = 30;
      return;
    } else if (latency < 20) {
      this.maxFps = 24;
      return;
    } else if (latency < 50) {
      this.maxFps = 10;
      return;
    }
  }

  public getMaxFps(): number {
    return this.maxFps;
  }

  public makeFrame(currentData: GameData) {}
}

/**
 * 연산의 핵심. 간단한 데이터를 제외하곤 여기서 연산이 이루어 진다.
 */
class GameRoom {
  public roomId: string;
  public users: GamePlayer[];
  public gameObj: GameData;
  public latency: number[];
  public animation: Animations;
  public keyPress: KeyPress[];
  public history: GameRecord[];

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
    this.animation = new Animations();
    this.keyPress[0] = new KeyPress();
    this.keyPress[1] = new KeyPress();
    this.history = histories;
    this.keyPress[0].setMaxUnit(100);
    this.keyPress[1].setMaxUnit(100);
  }

  public resetBall() {
    this.gameObj.currentPosX = 0;
    this.gameObj.currentPosY = 0;
  }

  public resetPaddle() {
    this.gameObj.paddle1 = 0;
    this.gameObj.paddle2 = 0;
  }

  public setLatency() {
    // TODO logic
    const latency = 60;
    const maxFps = this.animation.getMaxFps();
    this.animation.setMaxFps(latency);
    this.keyPress[0].setPressedNumberByMaxFps(maxFps);
    this.keyPress[1].setPressedNumberByMaxFps(maxFps);
  }

  public keyPressed(userIdx: number, value: number) {
    if (this.users[0].getUserObject().userIdx === userIdx) {
      this.keyPress[0].pushKey(value);
    } else if (this.users[1].getUserObject().userIdx === userIdx) {
      this.keyPress[1].pushKey(value);
    }
  }
}
