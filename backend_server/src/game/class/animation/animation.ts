import { FrameData } from 'src/game/enum/frame.data.enum';
import { GamePhase } from 'src/game/enum/game.phase';
import { KeyPress } from '../key.press/key.press';
import { GameData } from 'src/game/enum/game.data.enum';
import { Vector } from 'src/game/enum/game.vector.enum';

export class Animations {
  private readonly MAX_WIDTH = 500;
  private readonly min_WIDTH = -500;
  private readonly MAX_HEIGHT = 300;
  private readonly min_HEIGHT = -300;
  private readonly PADDLE_LINE_1 = -470;
  private readonly PADDLE_LINE_2 = 470;

  prevDatas: FrameData | null;
  currentDatas: FrameData | null;
  gameStatus: GamePhase;
  maxFps: number | null;
  currentFps: number;
  totalDistancePerSec: number;
  unitDistance: number;

  constructor() {
    this.prevDatas = null;
    this.currentDatas = null;
    this.maxFps = null;
    this.currentFps = 0;
    this.totalDistancePerSec = 150;
    this.gameStatus = GamePhase.ON_PLAYING;
  }

  // 레이턴시를 가지고 최대 FPS를 확정짓는다.
  public setMaxFps(latency: number) {
    if (this.maxFps === null) this.maxFps = 0;
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

  // getter FPS
  public getMaxFps(): number | null {
    return this.maxFps;
  }

  private setPaddleNotOverLimit(
    currentData: GameData,
    paddle1: number,
    paddle2: number,
  ) {
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
      if (currentData.paddle1MinMax[1] <= this.min_HEIGHT) {
        currentData.paddle1 = this.min_HEIGHT + 20;
        currentData.paddle1MinMax[0] = this.min_HEIGHT + 20;
        currentData.paddle1MinMax[1] = this.min_HEIGHT;
      }
    }
    currentData.paddle2MinMax = [
      (currentData.paddle2MinMax[0] += paddle2),
      (currentData.paddle2MinMax[1] += paddle2),
    ];
    if (currentData.paddle2 > 0) {
      // 패들 좌표 수정
      if (currentData.paddle2MinMax[0] >= this.MAX_HEIGHT) {
        currentData.paddle2 = this.MAX_HEIGHT - 20;
        currentData.paddle2MinMax[0] = this.MAX_HEIGHT;
        currentData.paddle2MinMax[1] = this.MAX_HEIGHT - 20;
      }
    } else {
      if (currentData.paddle2MinMax[1] <= this.min_HEIGHT) {
        currentData.paddle2 = this.min_HEIGHT + 20;
        currentData.paddle2MinMax[0] = this.min_HEIGHT + 20;
        currentData.paddle2MinMax[1] = this.min_HEIGHT;
      }
    }
  }

  // 기존 데이터를 기반으로 다음 프레임 연산을 진행한다.
  public makeFrame(currentData: GameData, key: KeyPress[]): GamePhase {
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
    this.setPaddleNotOverLimit(currentData, paddle1, paddle2);

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
    const type = this.checkStrike(currentData);
    if (type.length === 2 || type.length === 3) {
      const cond1 = type.find((vec) => vec === GamePhase.HIT_THE_WALL);
      const cond2 = type.find((vec) => vec === GamePhase.HIT_THE_PADDLE);
      const cond3 = type.find((vec) => vec === GamePhase.HIT_THE_GOAL_POST);
      if (
        cond1 === GamePhase.HIT_THE_WALL &&
        cond2 === GamePhase.HIT_THE_PADDLE
      ) {
        this.handleSituationWallAndPaddleStrike(currentData);
        this.gameStatus = GamePhase.HIT_THE_PADDLE;
        return this.gameStatus;
      } else if (
        cond1 === GamePhase.HIT_THE_WALL &&
        cond3 === GamePhase.HIT_THE_GOAL_POST
      ) {
        this.gameStatus =
          this.handleSituationWallAndGoalPostStrike(currentData);
        return this.gameStatus;
      }
      // TODO: 조건 두개 이상
    } else {
      if (type[0] === GamePhase.HIT_THE_WALL) {
        this.handleSituationWallStrike(currentData);
        this.gameStatus = GamePhase.HIT_THE_WALL;
        return this.gameStatus;
      } else if (type[0] === GamePhase.HIT_THE_PADDLE) {
        this.handleSituationPaddleStrike(currentData);
        this.gameStatus = GamePhase.HIT_THE_PADDLE;
        return this.gameStatus;
      } else if (type[0] === GamePhase.HIT_THE_GOAL_POST) {
        this.gameStatus = this.handleSituationGoalPostStrike(currentData);
        return this.gameStatus;
      }
      // TODO: 조건 한개 처리
    }
    this.gameStatus = GamePhase.ON_PLAYING;
    return this.gameStatus;
  }

  public handleSituationWallStrike(currentData: GameData) {
    currentData.standardY *= -1;
    currentData.angle =
      (currentData.standardY - 0) / (currentData.standardX - 0);
    currentData.yIntercept =
      currentData.standardY - currentData.angle * currentData.standardX;
    return;
  }

  public handleSituationPaddleStrike(currentData: GameData) {}

  public handleSituationGoalPostStrike(currentData: GameData): GamePhase {
    const ret: GamePhase = GamePhase.MATCH_END;
    return ret;
  }
  public handleSituationWallAndPaddleStrike(currentData: GameData) {}

  public handleSituationWallAndGoalPostStrike(
    currentData: GameData,
  ): GamePhase {
    const ret: GamePhase = GamePhase.MATCH_END;
    return ret;
  }

  public setNewlinearEquation(currentData: GameData) {
    currentData.angle =
      (currentData.standardY - 0) / (currentData.standardX - 0);
    currentData.yIntercept =
      currentData.standardY - currentData.angle * currentData.standardX;
  }

  // paddle에 부딪히는지 여부 판단
  private checkPaddleStrike(vector: Vector, currentData: GameData): boolean {
    let condition1;
    let condition2;
    if (vector === Vector.UPLEFT || vector === Vector.DWONLEFT) {
      const max = currentData.currentPosY + 20;
      const min = currentData.currentPosY - 20;
      condition1 =
        max <= currentData.paddle1MinMax[0] ||
        currentData.paddle1MinMax[1] <= min;
      condition2 =
        min >= currentData.paddle1MinMax[1] ||
        currentData.paddle1MinMax[0] >= max;
    } else {
      const max = currentData.currentPosY + 20;
      const min = currentData.currentPosY - 20;
      condition1 =
        max <= currentData.paddle2MinMax[0] ||
        currentData.paddle2MinMax[1] <= min;
      condition2 =
        min >= currentData.paddle2MinMax[1] ||
        currentData.paddle2MinMax[0] >= max;
    }
    return condition1 || condition2;
  }

  // 벽에 부딪히는지를 판단한다.
  public checkStrike(currentData: GameData): GamePhase[] {
    const ret: GamePhase[] = [];
    switch (currentData.vector) {
      case Vector.UPLEFT:
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY + 20 >= this.MAX_HEIGHT) {
          currentData.currentPosY = 280;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX - 20 <= this.PADDLE_LINE_1) {
          if (this.checkPaddleStrike(Vector.UPLEFT, currentData)) {
            currentData.currentPosX = this.PADDLE_LINE_1;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX - 20 <= this.min_WIDTH) {
          currentData.currentPosX = this.min_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
      case Vector.UPRIGHT:
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY + 20 >= this.MAX_HEIGHT) {
          currentData.currentPosY = 280;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX + 20 >= this.PADDLE_LINE_2) {
          if (this.checkPaddleStrike(Vector.UPRIGHT, currentData)) {
            currentData.currentPosX = this.PADDLE_LINE_2;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX + 20 >= this.MAX_WIDTH) {
          currentData.currentPosX = this.MAX_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
      case Vector.DWONLEFT:
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY + 20 <= this.min_HEIGHT) {
          currentData.currentPosY = -280;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX - 20 <= this.PADDLE_LINE_1) {
          if (this.checkPaddleStrike(Vector.DWONLEFT, currentData)) {
            currentData.currentPosX = this.PADDLE_LINE_1;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX - 20 <= this.min_WIDTH) {
          currentData.currentPosX = this.min_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
      case Vector.DOWNRIGHT:
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY + 20 <= this.min_HEIGHT) {
          currentData.currentPosY = -280;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX + 20 >= this.PADDLE_LINE_2) {
          if (this.checkPaddleStrike(Vector.DOWNRIGHT, currentData)) {
            currentData.currentPosX = this.PADDLE_LINE_2;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX + 20 >= this.MAX_WIDTH) {
          currentData.currentPosX = this.MAX_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
    }
    return ret;
  }

  //   // 벡터 방향을 바꾼다.
  //   public changeVector(currentData: GameData) {
  //     if (this.gameStatus === GamePhase.HIT_THE_WALL) {
  //       currentData.standardY *= -1;
  //     } else if (this.gameStatus === GamePhase.HIT_THE_PADDLE) {
  //       // TODO: paddle 보정으로 어떻게 바뀌는지 체크해야함
  //     }
  //   }
}
