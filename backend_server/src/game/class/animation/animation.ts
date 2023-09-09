import { FrameData } from 'src/game/enum/frame.data.enum';
import { GamePhase } from 'src/game/enum/game.phase';
import { KeyPress } from '../key.press/key.press';
import { GameData } from 'src/game/enum/game.data.enum';
import { Vector } from 'src/game/enum/game.vector.enum';
import { GameRoom } from '../game.room/game.room';

export class Animations {
  private totalDistancePerSec: number;
  private unitDistance: number;

  constructor(totalDistancePerSec: number) {
    this.totalDistancePerSec = totalDistancePerSec;
	this.unitDistance = 0;
  }

  // 레이턴시를 가지고 최대 FPS를 확정짓는다.
//   public setMaxFps(latency: number) {
//     if (latency < 8) {
//       this.maxFps = 60;
//     } else if (latency >= 8 && latency < 15) {
//       this.maxFps = 30;
//     } else if (latency >= 15 && latency < 20) {
//       this.maxFps = 24;
//     } else if (latency >= 20) {
//       this.maxFps = 10;
//     }
// 	// this.maxFps = 60;
//     this.unitDistance = parseFloat(
//       (this.totalDistancePerSec / this.maxFps).toFixed(2),
//     );
//   }

  // getter FPS
//   public getMaxFps(): number {
//     return this.maxFps;
//   }

  private setPaddleNotOverLimit(
    currentData: GameData,
    paddle1: number,
    paddle2: number,
  ) {
    currentData.paddle1MaxMin = [
      (currentData.paddle1MaxMin[0] += paddle1),
      (currentData.paddle1MaxMin[1] += paddle1),
    ];
    if (currentData.paddle1 > 0) {
      // 패들 좌표 수정
      if (currentData.paddle1MaxMin[0] >= this.MAX_HEIGHT) {
        currentData.paddle1 = this.MAX_HEIGHT - 20;
        currentData.paddle1MaxMin[0] = this.MAX_HEIGHT;
        currentData.paddle1MaxMin[1] = this.MAX_HEIGHT - 40;
      }
    } else {
      if (currentData.paddle1MaxMin[1] <= this.min_HEIGHT) {
        currentData.paddle1 = this.min_HEIGHT + 20;
        currentData.paddle1MaxMin[0] = this.min_HEIGHT + 40;
        currentData.paddle1MaxMin[1] = this.min_HEIGHT;
      }
    }
    currentData.paddle2MaxMin = [
      (currentData.paddle2MaxMin[0] += paddle2),
      (currentData.paddle2MaxMin[1] += paddle2),
    ];
    if (currentData.paddle2 > 0) {
      // 패들 좌표 수정
      if (currentData.paddle2MaxMin[0] >= this.MAX_HEIGHT) {
        currentData.paddle2 = this.MAX_HEIGHT - 20;
        currentData.paddle2MaxMin[0] = this.MAX_HEIGHT;
        currentData.paddle2MaxMin[1] = this.MAX_HEIGHT - 40;
      }
    } else {
      if (currentData.paddle2MaxMin[1] <= this.min_HEIGHT) {
        currentData.paddle2 = this.min_HEIGHT + 20;
        currentData.paddle2MaxMin[0] = this.min_HEIGHT + 40;
        currentData.paddle2MaxMin[1] = this.min_HEIGHT;
      }
    }
  }

  // 기존 데이터를 기반으로 다음 프레임 연산을 진행한다.
  public makeFrame(currentData: GameData, key: KeyPress[], room: GameRoom): GamePhase {
    // 좌표 계산
	if (currentData.vector === Vector.DOWNLEFT) {
    currentData.currentPosX = parseFloat(
      ((currentData.currentPosX - room.animation.unitDistance) + (currentData.gameSpeed -1)).toFixed(2),
    );
    currentData.currentPosY = parseFloat(
      // y = ax + b, a, b의 값을 미리 설정
      ((currentData.angle * currentData.currentPosX + currentData.yIntercept) + (currentData.gameSpeed -1 )).toFixed(2),
    );
	}
	else if (currentData.vector === Vector.DOWNRIGHT) {
		currentData.currentPosX = parseFloat(
      ((currentData.currentPosX + room.animation.unitDistance) + (currentData.gameSpeed - 1)).toFixed(2),
    	);
   	 	currentData.currentPosY = parseFloat(
      // y = ax + b, a, b의 값을 미리 설정
      ((currentData.angle * currentData.currentPosX + currentData.yIntercept) + (currentData.gameSpeed -1)).toFixed(2),
    );
	} else if (currentData.vector === Vector.UPLEFT){
		currentData.currentPosX = parseFloat(
      ((currentData.currentPosX - room.animation.unitDistance) + (currentData.gameSpeed - 1)).toFixed(2),
    	);
   	 	currentData.currentPosY = parseFloat(
      // y = ax + b, a, b의 값을 미리 설정
      ((currentData.angle * currentData.currentPosX + currentData.yIntercept) + (currentData.gameSpeed -1)).toFixed(2),
   		);
	} else if (currentData.vector === Vector.UPRIGHT) {
		currentData.currentPosX = parseFloat(
      ((currentData.currentPosX + room.animation.unitDistance) + (currentData.gameSpeed - 1)).toFixed(2),
    	);
   	 	currentData.currentPosY = parseFloat(
      // y = ax + b, a, b의 값을 미리 설정
      ((currentData.angle * currentData.currentPosX + currentData.yIntercept) + (currentData.gameSpeed -1)).toFixed(2),
   		);
	}


	if (currentData.currentPosX < room.animation.min_WIDTH)
		currentData.currentPosX = room.animation.min_WIDTH;
	else if (currentData.currentPosX > room.animation.MAX_WIDTH)
		currentData.currentPosX = room.animation.MAX_WIDTH;

	if (currentData.currentPosY < room.animation.min_HEIGHT)
		currentData.currentPosY = room.animation.min_HEIGHT;
	else if (currentData.currentPosY > room.animation.MAX_HEIGHT)
		currentData.currentPosY = room.animation.MAX_HEIGHT;

    // 페들 데이터 바꿈
     currentData.paddle1 = currentData.paddle1 + key[0].popKeyValue();
     currentData.paddle2 = currentData.paddle2 + key[1].popKeyValue();

    // 프레임 값 갱신
	currentData.currentFrame += 1;
	if (currentData.currentFrame === currentData.maxFrame)
	  currentData.currentFrame = 0;

    // 프레임 값 갱신 #2 paddle 최대, 최소 값 정리
    room.animation.setPaddleNotOverLimit(currentData, currentData.paddle1, currentData.paddle2);

    const type = room.animation.checkStrike(currentData, this);
	console.log(`이벤트 발생 : ${type} =============================================`);
    if (type.length === 2 || type.length === 3) {
      const cond1 = type.find((vec) => vec === GamePhase.HIT_THE_WALL);
      const cond2 = type.find((vec) => vec === GamePhase.HIT_THE_PADDLE);
      const cond3 = type.find((vec) => vec === GamePhase.HIT_THE_GOAL_POST);
      if (
        cond1 === GamePhase.HIT_THE_WALL &&
        cond2 === GamePhase.HIT_THE_PADDLE
      ) {
        room.animation.handleSituationWallAndPaddleStrike(currentData);
        room.animation.gameStatus = GamePhase.HIT_THE_PADDLE;
        return room.animation.gameStatus;
      } else if (
        cond1 === GamePhase.HIT_THE_WALL &&
        cond3 === GamePhase.HIT_THE_GOAL_POST
      ) {
        room.animation.gameStatus =
          room.animation.handleSituationWallAndGoalPostStrike(currentData);
        return room.animation.gameStatus;
      }
      // TODO: 조건 두개 이상
    } else {
      if (type[0] === GamePhase.HIT_THE_WALL) {
		console.log(`벽충돌로 좌표 수정`);
        currentData = room.animation.handleSituationWallStrike(currentData);
        room.animation.gameStatus = GamePhase.HIT_THE_WALL;
        return room.animation.gameStatus;
      } else if (type[0] === GamePhase.HIT_THE_PADDLE) {
		console.log(`페등 충돌로 좌표 수정`);
        room.animation.handleSituationPaddleStrike(currentData);
        room.animation.gameStatus = GamePhase.HIT_THE_PADDLE;
        return room.animation.gameStatus;
      } else if (type[0] === GamePhase.HIT_THE_GOAL_POST) {
		console.log(`골대 충돌`)
        room.animation.gameStatus = room.animation.handleSituationGoalPostStrike(currentData);
        return room.animation.gameStatus;
      }
      // TODO: 조건 한개 처리
    }
    room.animation.gameStatus = GamePhase.ON_PLAYING;
    return room.animation.gameStatus;
  }

  private reverseVectorY(currentData: GameData) {
    currentData.angleY *= -1;
    if (currentData.vector === Vector.UPRIGHT) {
      currentData.vector = Vector.DOWNRIGHT;
    } else if (currentData.vector === Vector.DOWNRIGHT) {
      currentData.vector = Vector.UPRIGHT;
    } else if (currentData.vector === Vector.UPLEFT) {
      currentData.vector = Vector.DOWNLEFT;
    } else {
      currentData.vector = Vector.UPLEFT;
    }
  }

  private reverseVectorX(currentData: GameData) {
    if (currentData.vector === Vector.UPRIGHT) {
      currentData.vector = Vector.DOWNLEFT;
    } else if (currentData.vector === Vector.DOWNRIGHT) {
      currentData.vector = Vector.UPLEFT;
    } else if (currentData.vector === Vector.UPLEFT) {
      currentData.vector = Vector.DOWNRIGHT;
    } else {
      currentData.vector = Vector.UPLEFT;
    }
  }

  public handleSituationWallStrike(currentData: GameData): GameData {
    this.reverseVectorY(currentData);
    this.setRenewLinearEquation(currentData);
    return currentData;
  }

  private changeAngleForPaddle(currentData: GameData) {
    switch (currentData.vector) {
      case Vector.UPRIGHT:
        if (currentData.standardX === -1 && currentData.standardY === 2) {
          currentData.standardX = 2;
          currentData.standardY = 1;
        } else if (
          currentData.standardX === -1 &&
          currentData.standardY == -1
        ) {
          currentData.standardX = 1;
          currentData.standardY = 1;
        } else {
          currentData.standardX = 1;
          currentData.standardY = 2;
        }
        break;
      case Vector.UPLEFT:
        if (currentData.standardX === 1 && currentData.standardY === 2) {
          currentData.standardX = -2;
          currentData.standardY = 1;
        } else if (currentData.standardX === 1 && currentData.standardY === 1) {
          currentData.standardX = -1;
          currentData.standardY = 1;
        } else {
          currentData.standardX = -1;
          currentData.standardY = 2;
        }
        break;
      case Vector.DOWNRIGHT:
        if (currentData.standardX === -2 && currentData.standardY === -1) {
          currentData.standardX = 1;
          currentData.standardY = -2;
        } else if (
          currentData.standardX === -1 &&
          currentData.standardY === -1
        ) {
          currentData.standardX = 1;
          currentData.standardY = -1;
        } else {
          currentData.standardX = 2;
          currentData.standardY = -1;
        }
        break;
      case Vector.DOWNLEFT:
        if (currentData.standardX === 1 && currentData.standardY === -2) {
          currentData.standardX = -2;
          currentData.standardY = -1;
        } else if (
          currentData.standardX === 1 &&
          currentData.standardY === -1
        ) {
          currentData.standardX = -1;
          currentData.standardY = -1;
        } else {
          currentData.standardX = -1;
          currentData.standardY = -2;
        }
        break;
    }
  }

  public handleSituationPaddleStrike(currentData: GameData) {
    const type: Vector = currentData.vector;
    if (type === Vector.DOWNRIGHT || type === Vector.UPRIGHT) {
      this.reverseVectorX(currentData);
      const y = currentData.currentPosY;
      const maxY = currentData.paddle1MaxMin[0];
      const minY = currentData.paddle1MaxMin[1];
      const rangeSize = Math.round((maxY - minY + 1) / 3);
      if (y > maxY - rangeSize) {
        //상단
        this.changeAngleForPaddle(currentData);
      } else if (y >= minY + rangeSize && y <= maxY - rangeSize) {
        //중간
        currentData.standardX *= -1;
      } else {
        //하단
        this.changeAngleForPaddle(currentData);
      }
    } else {
      this.reverseVectorX(currentData);
      const y = currentData.currentPosY;
      const maxY = currentData.paddle2MaxMin[0];
      const minY = currentData.paddle2MaxMin[1];
      const rangeSize = Math.round((maxY - minY + 1) / 3);
      if (y > maxY - rangeSize) {
        //상단
        this.changeAngleForPaddle(currentData);
      } else if (y >= minY + rangeSize && y <= maxY - rangeSize) {
        //중간
        currentData.standardX *= -1;
      } else {
        //하단
        this.changeAngleForPaddle(currentData);
      }
    }
    this.setRenewLinearEquation(currentData);
  }

  public handleSituationGoalPostStrike(currentData: GameData): GamePhase {
    const type = currentData.vector;
    if (type === Vector.UPRIGHT || type === Vector.DOWNRIGHT) {
      currentData.score2++;
      if (currentData.score2 === 5) {
        const ret: GamePhase = GamePhase.MATCH_END;
        return ret;
      }
      const ret: GamePhase = GamePhase.HIT_THE_GOAL_POST;
      return ret;
    } else {
      currentData.score1++;
      if (currentData.score1 === 5) {
        const ret: GamePhase = GamePhase.MATCH_END;
        return ret;
      }
      const ret: GamePhase = GamePhase.HIT_THE_GOAL_POST;
      return ret;
    }
  }

  public handleSituationWallAndPaddleStrike(currentData: GameData) {
    this.handleSituationWallStrike(currentData);
    this.handleSituationPaddleStrike(currentData);
  }

  public handleSituationWallAndGoalPostStrike(
    currentData: GameData,
  ): GamePhase {
    const ret: GamePhase = GamePhase.MATCH_END;
    return ret;
  }

  public setRenewLinearEquation(currentData: GameData) {
	// 기준 좌표 구하기
	currentData.standardX = currentData.currentPosX + currentData.angleX;
	currentData.standardY = currentData.currentPosY + currentData.angleY;

    currentData.angle =
      Math.round((currentData.standardY - currentData.currentPosY) / (currentData.standardX - currentData.currentPosX));
    currentData.yIntercept =
      Math.round(currentData.standardY - currentData.angle * currentData.standardX);
	}

  // paddle에 부딪히는지 여부 판단
  private checkPaddleStrike(vector: Vector, currentData: GameData): boolean {
    let condition1;
    let condition2;
    if (vector === Vector.UPRIGHT || vector === Vector.DOWNRIGHT) {
      const max = currentData.currentPosY + 20;
      const min = currentData.currentPosY - 20;
      condition1 =
        max <= currentData.paddle2MaxMin[0] ||
        currentData.paddle2MaxMin[1] <= min;
      condition2 =
        min >= currentData.paddle2MaxMin[1] ||
        currentData.paddle2MaxMin[0] >= max;
    } else {
      const max = currentData.currentPosY + 20;
      const min = currentData.currentPosY - 20;
      condition1 =
        max <= currentData.paddle2MaxMin[0] ||
        currentData.paddle2MaxMin[1] <= min;
      condition2 =
        min >= currentData.paddle2MaxMin[1] ||
        currentData.paddle2MaxMin[0] >= max;
    }
    const  value = condition1 || condition2;
	console.log(` 패들 부딪힘! ${value}`);
	return value;
  }

  // 벽에 부딪히는지를 판단한다.
  public checkStrike(currentData: GameData, aniData:Animations): GamePhase[] {
    const ret: GamePhase[] = [];
	console.log('현재 벡터 : ', currentData.vector );
	console.log(`현재 각도 : ${currentData.angle}`);
	console.log(`현재 Y 절편 : ${currentData.yIntercept}`);
	console.log(`현재 X : ${currentData.currentPosX}`);
	console.log(`현재 Y : ${currentData.currentPosY}`);
	console.log(`각도 X : ${currentData.angleX}`);
	console.log(`각도 Y : ${currentData.angleY}`);
	console.log(`기준 X : ${currentData.standardX}`);
	console.log(`기준 Y : ${currentData.standardY}`);
	console.log(`현재 벡터 : ${currentData.vector}`)
	console.log(`현재 프레임 : ${currentData.currentFrame} / ${currentData.maxFrame}`)
	console.log(`현재 페들1 : ${currentData.paddle1}`)
	console.log(`현재 페들2 : ${currentData.paddle2}`)
    switch (currentData.vector) {
      case Vector.UPRIGHT:
		console.log('이벤트 발생! : 상우');
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY - 20 <= aniData.min_HEIGHT) {
          currentData.currentPosY = aniData.min_HEIGHT + 20;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX + 20 >= aniData.PADDLE_LINE_2) {
          if (aniData.checkPaddleStrike(Vector.UPRIGHT, currentData)) {
			console.log(`paddle 충돌 : ${currentData.currentPosX} / ${currentData.currentPosY}`);
            currentData.currentPosX = aniData.PADDLE_LINE_2 - 20;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX - 20 <= aniData.min_WIDTH) {
          currentData.currentPosX = aniData.min_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
      case Vector.UPLEFT:
		console.log('이벤트 발생! : 상좌');
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY - 20 <= aniData.min_HEIGHT) {
          currentData.currentPosY = aniData.min_HEIGHT + 20;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX - 20 <= aniData.PADDLE_LINE_1) {
          if (aniData.checkPaddleStrike(Vector.UPLEFT, currentData)) {
			console.log(`paddle 충돌 : ${currentData.currentPosX} / ${currentData.currentPosY}`);
            currentData.currentPosX = aniData.PADDLE_LINE_1 + 20;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX + 20 >= aniData.MAX_WIDTH) {
          currentData.currentPosX = aniData.MAX_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
      case Vector.DOWNRIGHT:
		console.log('이벤트 발생! : 하우');
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY + 20 >= aniData.MAX_HEIGHT) {
          currentData.currentPosY = aniData.MAX_HEIGHT - 20;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX + 20 >= aniData.PADDLE_LINE_2) {
          if (aniData.checkPaddleStrike(Vector.DOWNRIGHT, currentData)) {
			console.log(`paddle 충돌 : ${currentData.currentPosX} / ${currentData.currentPosY}`);
            currentData.currentPosX = aniData.PADDLE_LINE_2 - 20;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX - 20 <= aniData.min_WIDTH) {
          currentData.currentPosX = aniData.min_WIDTH;
          ret.push(GamePhase.HIT_THE_GOAL_POST);
        }
        break;
      case Vector.DOWNLEFT:
		console.log('이벤트 발생! : 하좌');
        // 벽에 부딪히는지를 확인
        if (currentData.currentPosY + 20 >= aniData.MAX_HEIGHT) {
          currentData.currentPosY = aniData.MAX_HEIGHT - 20 ;
          ret.push(GamePhase.HIT_THE_WALL);
        }
        // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
        if (currentData.currentPosX - 20 <= aniData.PADDLE_LINE_1) {
          if (aniData.checkPaddleStrike(Vector.DOWNLEFT, currentData)) {
			console.log(`paddle 충돌 : ${currentData.currentPosX} / ${currentData.currentPosY}`);
            currentData.currentPosX = aniData.PADDLE_LINE_1 + 20;
            ret.push(GamePhase.HIT_THE_PADDLE);
          }
        }
        // 골대 라인에 부딪히는지 확인
        if (currentData.currentPosX + 20 >= aniData.MAX_WIDTH) {
          currentData.currentPosX = aniData.MAX_WIDTH;
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
