import { FrameData } from 'src/game/enum/frame.data.enum';
import { GamePhase } from 'src/game/enum/game.phase';
import { KeyPress } from '../key.press/key.press';
import { GameData } from 'src/game/enum/game.data.enum';
import { Vector } from 'src/game/enum/game.vector.enum';
import { GameRoom } from '../game.room/game.room';

export class Animations {
  private totalDistancePerSec: number;
  private unitDistance: number;

  constructor() {
    this.totalDistancePerSec = 100;
    this.unitDistance = 0;
  }

  public setUnitDistance(maxFps: number) {
	this.unitDistance = parseFloat(
      (this.totalDistancePerSec / maxFps).toFixed(2),
    );
	}

  // 기존 데이터를 기반으로 다음 프레임 연산을 진행한다.
  public makeFrame(room: GameRoom, key: KeyPress[]): GameData {
    if (
      room.gameObj.vector === Vector.DOWNLEFT ||
      room.gameObj.vector === Vector.UPLEFT
    ) {
      room.gameObj.currentPos[0] = parseFloat(
        (
          room.gameObj.currentPos[0] - room.animation.unitDistance +
(room.gameObj.gameSpeed - 1)
        ).toFixed(2),
      );
    } else if (
      room.gameObj.vector === Vector.DOWNRIGHT ||
	  room.gameObj.vector === Vector.UPRIGHT
      
    ) {
      room.gameObj.currentPos[0] = parseFloat(
        (
          room.gameObj.currentPos[0] + room.animation.unitDistance +
          (room.gameObj.gameSpeed - 1)
        ).toFixed(2),
      );
    }
    room.gameObj.currentPos[1] = parseFloat(
      (
        room.gameObj.anglePos[0] * room.gameObj.currentPos[0] +
        room.gameObj.anglePos[1] +
        (room.gameObj.gameSpeed - 1)
      ).toFixed(2),
    );

    // 페들 데이터 바꿈
    //TODO: 키보드 입력 잘못 들어올 수도 있음
    room.gameObj.paddle1[0] -= key[0].popKeyValue();
    room.gameObj.paddle1[1][0] -= key[0].popKeyValue();
    room.gameObj.paddle1[1][1] -= key[0].popKeyValue();
    room.gameObj.paddle2[0] -= key[1].popKeyValue();
    room.gameObj.paddle2[1][0] -= key[1].popKeyValue();
    room.gameObj.paddle2[1][1] -= key[1].popKeyValue();

    // 프레임 값 갱신
    room.gameObj.frameData[0] += 1;
    if (room.gameObj.frameData[0] === room.gameObj.frameData[1])
      room.gameObj.frameData[0] = 0;
  	return room.gameObj;
  }
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

//   private setPaddleNotOverLimit(
//     room: GameData,
//     paddle1: number,
//     paddle2: number,
//   ) {
//     room.paddle1MaxMin = [
//       (room.paddle1MaxMin[0] += paddle1),
//       (room.paddle1MaxMin[1] += paddle1),
//     ];
//     if (room.paddle1 > 0) {
//       // 패들 좌표 수정
//       if (room.paddle1MaxMin[0] >= this.MAX_HEIGHT) {
//         room.paddle1 = this.MAX_HEIGHT - 20;
//         room.paddle1MaxMin[0] = this.MAX_HEIGHT;
//         room.paddle1MaxMin[1] = this.MAX_HEIGHT - 40;
//       }
//     } else {
//       if (room.paddle1MaxMin[1] <= this.min_HEIGHT) {
//         room.paddle1 = this.min_HEIGHT + 20;
//         room.paddle1MaxMin[0] = this.min_HEIGHT + 40;
//         room.paddle1MaxMin[1] = this.min_HEIGHT;
//       }
//     }
//     room.paddle2MaxMin = [
//       (room.paddle2MaxMin[0] += paddle2),
//       (room.paddle2MaxMin[1] += paddle2),
//     ];
//     if (room.paddle2 > 0) {
//       // 패들 좌표 수정
//       if (room.paddle2MaxMin[0] >= this.MAX_HEIGHT) {
//         room.paddle2 = this.MAX_HEIGHT - 20;
//         room.paddle2MaxMin[0] = this.MAX_HEIGHT;
//         room.paddle2MaxMin[1] = this.MAX_HEIGHT - 40;
//       }
//     } else {
//       if (room.paddle2MaxMin[1] <= this.min_HEIGHT) {
//         room.paddle2 = this.min_HEIGHT + 20;
//         room.paddle2MaxMin[0] = this.min_HEIGHT + 40;
//         room.paddle2MaxMin[1] = this.min_HEIGHT;
//       }
//     }
//   }

// // 프레임 값 갱신 #2 paddle 최대, 최소 값 정리
// room.animation.setPaddleNotOverLimit(
//   room,
//   room.paddle1,
//   room.paddle2,
// );

// const type = room.animation.checkStrike(room, this);
// console.log(
//   `이벤트 발생 : ${type} =============================================`,
// );
// if (type.length === 2 || type.length === 3) {
//   const cond1 = type.find((vec) => vec === GamePhase.HIT_THE_WALL);
//   const cond2 = type.find((vec) => vec === GamePhase.HIT_THE_PADDLE);
//   const cond3 = type.find((vec) => vec === GamePhase.HIT_THE_GOAL_POST);
//   if (
//     cond1 === GamePhase.HIT_THE_WALL &&
//     cond2 === GamePhase.HIT_THE_PADDLE
//   ) {
//     room.animation.handleSituationWallAndPaddleStrike(room);
//     room.animation.gameStatus = GamePhase.HIT_THE_PADDLE;
//     return room.animation.gameStatus;
//   } else if (
//     cond1 === GamePhase.HIT_THE_WALL &&
//     cond3 === GamePhase.HIT_THE_GOAL_POST
//   ) {
//     room.animation.gameStatus =
//       room.animation.handleSituationWallAndGoalPostStrike(room);
//     return room.animation.gameStatus;
//   }
//   // TODO: 조건 두개 이상
// } else {
//   if (type[0] === GamePhase.HIT_THE_WALL) {
//     console.log(`벽충돌로 좌표 수정`);
//     room = room.animation.handleSituationWallStrike(room);
//     room.animation.gameStatus = GamePhase.HIT_THE_WALL;
//     return room.animation.gameStatus;
//   } else if (type[0] === GamePhase.HIT_THE_PADDLE) {
//     console.log(`페등 충돌로 좌표 수정`);
//     room.animation.handleSituationPaddleStrike(room);
//     room.animation.gameStatus = GamePhase.HIT_THE_PADDLE;
//     return room.animation.gameStatus;
//   } else if (type[0] === GamePhase.HIT_THE_GOAL_POST) {
//     console.log(`골대 충돌`);
//     room.animation.gameStatus =
//       room.animation.handleSituationGoalPostStrike(room);
//     return room.animation.gameStatus;
//   }
//   // TODO: 조건 한개 처리
// }
// room.animation.gameStatus = GamePhase.ON_PLAYING;
// return room.animation.gameStatus;
//   }

//   private reverseVectorY(room: GameData) {
//     room.angleY *= -1;
//     if (room.vector === Vector.UPRIGHT) {
//       room.vector = Vector.DOWNRIGHT;
//     } else if (room.vector === Vector.DOWNRIGHT) {
//       room.vector = Vector.UPRIGHT;
//     } else if (room.vector === Vector.UPLEFT) {
//       room.vector = Vector.DOWNLEFT;
//     } else {
//       room.vector = Vector.UPLEFT;
//     }
//   }

//   private reverseVectorX(room: GameData) {
//     if (room.vector === Vector.UPRIGHT) {
//       room.vector = Vector.DOWNLEFT;
//     } else if (room.vector === Vector.DOWNRIGHT) {
//       room.vector = Vector.UPLEFT;
//     } else if (room.vector === Vector.UPLEFT) {
//       room.vector = Vector.DOWNRIGHT;
//     } else {
//       room.vector = Vector.UPLEFT;
//     }
//   }

//   public handleSituationWallStrike(room: GameData): GameData {
//     this.reverseVectorY(room);
//     this.setRenewLinearEquation(room);
//     return room;
//   }

//   private changeAngleForPaddle(room: GameData) {
//     switch (room.vector) {
//       case Vector.UPRIGHT:
//         if (room.standardX === -1 && room.standardY === 2) {
//           room.standardX = 2;
//           room.standardY = 1;
//         } else if (
//           room.standardX === -1 &&
//           room.standardY == -1
//         ) {
//           room.standardX = 1;
//           room.standardY = 1;
//         } else {
//           room.standardX = 1;
//           room.standardY = 2;
//         }
//         break;
//       case Vector.UPLEFT:
//         if (room.standardX === 1 && room.standardY === 2) {
//           room.standardX = -2;
//           room.standardY = 1;
//         } else if (room.standardX === 1 && room.standardY === 1) {
//           room.standardX = -1;
//           room.standardY = 1;
//         } else {
//           room.standardX = -1;
//           room.standardY = 2;
//         }
//         break;
//       case Vector.DOWNRIGHT:
//         if (room.standardX === -2 && room.standardY === -1) {
//           room.standardX = 1;
//           room.standardY = -2;
//         } else if (
//           room.standardX === -1 &&
//           room.standardY === -1
//         ) {
//           room.standardX = 1;
//           room.standardY = -1;
//         } else {
//           room.standardX = 2;
//           room.standardY = -1;
//         }
//         break;
//       case Vector.DOWNLEFT:
//         if (room.standardX === 1 && room.standardY === -2) {
//           room.standardX = -2;
//           room.standardY = -1;
//         } else if (
//           room.standardX === 1 &&
//           room.standardY === -1
//         ) {
//           room.standardX = -1;
//           room.standardY = -1;
//         } else {
//           room.standardX = -1;
//           room.standardY = -2;
//         }
//         break;
//     }
//   }

//   public handleSituationPaddleStrike(room: GameData) {
//     const type: Vector = room.vector;
//     if (type === Vector.DOWNRIGHT || type === Vector.UPRIGHT) {
//       this.reverseVectorX(room);
//       const y = room.currentPosY;
//       const maxY = room.paddle1MaxMin[0];
//       const minY = room.paddle1MaxMin[1];
//       const rangeSize = Math.round((maxY - minY + 1) / 3);
//       if (y > maxY - rangeSize) {
//         //상단
//         this.changeAngleForPaddle(room);
//       } else if (y >= minY + rangeSize && y <= maxY - rangeSize) {
//         //중간
//         room.standardX *= -1;
//       } else {
//         //하단
//         this.changeAngleForPaddle(room);
//       }
//     } else {
//       this.reverseVectorX(room);
//       const y = room.currentPosY;
//       const maxY = room.paddle2MaxMin[0];
//       const minY = room.paddle2MaxMin[1];
//       const rangeSize = Math.round((maxY - minY + 1) / 3);
//       if (y > maxY - rangeSize) {
//         //상단
//         this.changeAngleForPaddle(room);
//       } else if (y >= minY + rangeSize && y <= maxY - rangeSize) {
//         //중간
//         room.standardX *= -1;
//       } else {
//         //하단
//         this.changeAngleForPaddle(room);
//       }
//     }
//     this.setRenewLinearEquation(room);
//   }

//   public handleSituationGoalPostStrike(room: GameData): GamePhase {
//     const type = room.vector;
//     if (type === Vector.UPRIGHT || type === Vector.DOWNRIGHT) {
//       room.score2++;
//       if (room.score2 === 5) {
//         const ret: GamePhase = GamePhase.MATCH_END;
//         return ret;
//       }
//       const ret: GamePhase = GamePhase.HIT_THE_GOAL_POST;
//       return ret;
//     } else {
//       room.score1++;
//       if (room.score1 === 5) {
//         const ret: GamePhase = GamePhase.MATCH_END;
//         return ret;
//       }
//       const ret: GamePhase = GamePhase.HIT_THE_GOAL_POST;
//       return ret;
//     }
//   }

//   public handleSituationWallAndPaddleStrike(room: GameData) {
//     this.handleSituationWallStrike(room);
//     this.handleSituationPaddleStrike(room);
//   }

//   public handleSituationWallAndGoalPostStrike(
//     room: GameData,
//   ): GamePhase {
//     const ret: GamePhase = GamePhase.MATCH_END;
//     return ret;
//   }

//   public setRenewLinearEquation(room: GameData) {
//     // 기준 좌표 구하기
//     room.standardX = room.currentPosX + room.angleX;
//     room.standardY = room.currentPosY + room.angleY;

//     room.angle = Math.round(
//       (room.standardY - room.currentPosY) /
//         (room.standardX - room.currentPosX),
//     );
//     room.yIntercept = Math.round(
//       room.standardY - room.angle * room.standardX,
//     );
//   }

//   // paddle에 부딪히는지 여부 판단
//   private checkPaddleStrike(vector: Vector, room: GameData): boolean {
//     let condition1;
//     let condition2;
//     if (vector === Vector.UPRIGHT || vector === Vector.DOWNRIGHT) {
//       const max = room.currentPosY + 20;
//       const min = room.currentPosY - 20;
//       condition1 =
//         max <= room.paddle2MaxMin[0] ||
//         room.paddle2MaxMin[1] <= min;
//       condition2 =
//         min >= room.paddle2MaxMin[1] ||
//         room.paddle2MaxMin[0] >= max;
//     } else {
//       const max = room.currentPosY + 20;
//       const min = room.currentPosY - 20;
//       condition1 =
//         max <= room.paddle2MaxMin[0] ||
//         room.paddle2MaxMin[1] <= min;
//       condition2 =
//         min >= room.paddle2MaxMin[1] ||
//         room.paddle2MaxMin[0] >= max;
//     }
//     const value = condition1 || condition2;
//     console.log(` 패들 부딪힘! ${value}`);
//     return value;
//   }

//   // 벽에 부딪히는지를 판단한다.
//   public checkStrike(room: GameData, aniData: Animations): GamePhase[] {
//     const ret: GamePhase[] = [];
//     console.log('현재 벡터 : ', room.vector);
//     console.log(`현재 각도 : ${room.angle}`);
//     console.log(`현재 Y 절편 : ${room.yIntercept}`);
//     console.log(`현재 X : ${room.currentPosX}`);
//     console.log(`현재 Y : ${room.currentPosY}`);
//     console.log(`각도 X : ${room.angleX}`);
//     console.log(`각도 Y : ${room.angleY}`);
//     console.log(`기준 X : ${room.standardX}`);
//     console.log(`기준 Y : ${room.standardY}`);
//     console.log(`현재 벡터 : ${room.vector}`);
//     console.log(
//       `현재 프레임 : ${room.currentFrame} / ${room.maxFrame}`,
//     );
//     console.log(`현재 페들1 : ${room.paddle1}`);
//     console.log(`현재 페들2 : ${room.paddle2}`);
//     switch (room.vector) {
//       case Vector.UPRIGHT:
//         console.log('이벤트 발생! : 상우');
//         // 벽에 부딪히는지를 확인
//         if (room.currentPosY - 20 <= aniData.min_HEIGHT) {
//           room.currentPosY = aniData.min_HEIGHT + 20;
//           ret.push(GamePhase.HIT_THE_WALL);
//         }
//         // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
//         if (room.currentPosX + 20 >= aniData.PADDLE_LINE_2) {
//           if (aniData.checkPaddleStrike(Vector.UPRIGHT, room)) {
//             console.log(
//               `paddle 충돌 : ${room.currentPosX} / ${room.currentPosY}`,
//             );
//             room.currentPosX = aniData.PADDLE_LINE_2 - 20;
//             ret.push(GamePhase.HIT_THE_PADDLE);
//           }
//         }
//         // 골대 라인에 부딪히는지 확인
//         if (room.currentPosX - 20 <= aniData.min_WIDTH) {
//           room.currentPosX = aniData.min_WIDTH;
//           ret.push(GamePhase.HIT_THE_GOAL_POST);
//         }
//         break;
//       case Vector.UPLEFT:
//         console.log('이벤트 발생! : 상좌');
//         // 벽에 부딪히는지를 확인
//         if (room.currentPosY - 20 <= aniData.min_HEIGHT) {
//           room.currentPosY = aniData.min_HEIGHT + 20;
//           ret.push(GamePhase.HIT_THE_WALL);
//         }
//         // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
//         if (room.currentPosX - 20 <= aniData.PADDLE_LINE_1) {
//           if (aniData.checkPaddleStrike(Vector.UPLEFT, room)) {
//             console.log(
//               `paddle 충돌 : ${room.currentPosX} / ${room.currentPosY}`,
//             );
//             room.currentPosX = aniData.PADDLE_LINE_1 + 20;
//             ret.push(GamePhase.HIT_THE_PADDLE);
//           }
//         }
//         // 골대 라인에 부딪히는지 확인
//         if (room.currentPosX + 20 >= aniData.MAX_WIDTH) {
//           room.currentPosX = aniData.MAX_WIDTH;
//           ret.push(GamePhase.HIT_THE_GOAL_POST);
//         }
//         break;
//       case Vector.DOWNRIGHT:
//         console.log('이벤트 발생! : 하우');
//         // 벽에 부딪히는지를 확인
//         if (room.currentPosY + 20 >= aniData.MAX_HEIGHT) {
//           room.currentPosY = aniData.MAX_HEIGHT - 20;
//           ret.push(GamePhase.HIT_THE_WALL);
//         }
//         // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
//         if (room.currentPosX + 20 >= aniData.PADDLE_LINE_2) {
//           if (aniData.checkPaddleStrike(Vector.DOWNRIGHT, room)) {
//             console.log(
//               `paddle 충돌 : ${room.currentPosX} / ${room.currentPosY}`,
//             );
//             room.currentPosX = aniData.PADDLE_LINE_2 - 20;
//             ret.push(GamePhase.HIT_THE_PADDLE);
//           }
//         }
//         // 골대 라인에 부딪히는지 확인
//         if (room.currentPosX - 20 <= aniData.min_WIDTH) {
//           room.currentPosX = aniData.min_WIDTH;
//           ret.push(GamePhase.HIT_THE_GOAL_POST);
//         }
//         break;
//       case Vector.DOWNLEFT:
//         console.log('이벤트 발생! : 하좌');
//         // 벽에 부딪히는지를 확인
//         if (room.currentPosY + 20 >= aniData.MAX_HEIGHT) {
//           room.currentPosY = aniData.MAX_HEIGHT - 20;
//           ret.push(GamePhase.HIT_THE_WALL);
//         }
//         // 패들 라인에 들어가는지 검증하고, 이럴 경우 패들 부딪힘 여부 판단
//         if (room.currentPosX - 20 <= aniData.PADDLE_LINE_1) {
//           if (aniData.checkPaddleStrike(Vector.DOWNLEFT, room)) {
//             console.log(
//               `paddle 충돌 : ${room.currentPosX} / ${room.currentPosY}`,
//             );
//             room.currentPosX = aniData.PADDLE_LINE_1 + 20;
//             ret.push(GamePhase.HIT_THE_PADDLE);
//           }
//         }
//         // 골대 라인에 부딪히는지 확인
//         if (room.currentPosX + 20 >= aniData.MAX_WIDTH) {
//           room.currentPosX = aniData.MAX_WIDTH;
//           ret.push(GamePhase.HIT_THE_GOAL_POST);
//         }
//         break;
//     }
//     return ret;
//   }

//   // 벡터 방향을 바꾼다.
//   public changeVector(room: GameData) {
//     if (this.gameStatus === GamePhase.HIT_THE_WALL) {
//       room.standardY *= -1;
//     } else if (this.gameStatus === GamePhase.HIT_THE_PADDLE) {
//       // TODO: paddle 보정으로 어떻게 바뀌는지 체크해야함
//     }
//   }
