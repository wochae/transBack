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
    this.totalDistancePerSec = 150;
    this.unitDistance = 0;
  }

  public setUnitDistance(maxFps: number) {
    this.unitDistance = parseFloat(
      (this.totalDistancePerSec / maxFps).toFixed(2),
    );
  }

  // 기존 데이터를 기반으로 다음 프레임 연산을 진행한다.
  public makeFrame(room: GameRoom, key: KeyPress[]): GameData {
    const radianAngle = Math.atan(room.gameObj.linearEquation[0]);
    const cosAngle = Math.cos(radianAngle);
    const sinAngle = Math.sin(radianAngle);
    let newX;
    let newY;

    // newX = room.animation.unitDistance * cosAngle;
    // newY = room.animation.unitDistance * sinAngle;
    if (
      room.gameObj.vector === Vector.DOWNLEFT ||
      room.gameObj.vector === Vector.UPLEFT
    ) {
      newX = -room.animation.unitDistance * cosAngle;
      newY = -room.animation.unitDistance * sinAngle;
    } else if (
      room.gameObj.vector === Vector.DOWNRIGHT ||
      room.gameObj.vector === Vector.UPRIGHT
    ) {
      newX = room.animation.unitDistance * cosAngle;
      newY = room.animation.unitDistance * sinAngle;
    }
    // else if (room.gameObj.vector === Vector.UPLEFT) {
    //   newX = -room.animation.unitDistance * cosAngle;
    //   newY = -room.animation.unitDistance * sinAngle;
    // } else if (room.gameObj.vector === Vector.UPRIGHT) {
    //   newX = room.animation.unitDistance * cosAngle;
    //   newY = -room.animation.unitDistance * sinAngle;
    // }
    room.gameObj.currentPos = [
      parseInt((room.gameObj.currentPos[0] + newX).toFixed(2)),
      parseInt((room.gameObj.currentPos[1] + newY).toFixed(2)),
    ];
    room.animation.unitDistance =
      room.animation.unitDistance +
      (room.gameObj.gameSpeed + 1) / (room.gameObj.frameData[1] * 10);

    // if (
    //   room.gameObj.vector === Vector.DOWNLEFT ||
    //   room.gameObj.vector === Vector.UPLEFT
    // ) {
    //   //   console.log(`here?`);
    //   room.gameObj.currentPos[0] = parseFloat(
    //     (
    //     //   room.gameObj.currentPos[0] -
    //     //   room.animation.unitDistance -
    //     //   room.gameObj.gameSpeed * 2
    //     ).toFixed(2),
    //   );
    // } else if (
    //   room.gameObj.vector === Vector.DOWNRIGHT ||
    //   room.gameObj.vector === Vector.UPRIGHT
    // ) {
    //   //   console.log(`here?`);

    //     //   room.gameObj.currentPos[0] +
    //     //   room.animation.unitDistance +
    //     //   room.gameObj.gameSpeed * 2
    // }
    // console.log("============");
    // console.log(`바뀐 x 값 : ${room.gameObj.currentPos[0]}`);
    // console.log("============");

    // room.gameObj.currentPos[1] = parseFloat(
    //   (
    //     room.gameObj.linearEquation[0] * room.gameObj.currentPos[0] +
    //     room.gameObj.linearEquation[1] +
    //     room.gameObj.gameSpeed * 2
    //   ).toFixed(2),
    // );

    // 페들 데이터 바꿈
    //TODO: 키보드 입력 잘못 들어올 수도 있음
    const paddle1 = key[0].popKeyValue();
    const paddle2 = key[1].popKeyValue();
    room.gameObj.paddle1[0] -= paddle1;
    room.gameObj.paddle1[1][0] -= paddle1;
    room.gameObj.paddle1[1][1] -= paddle1;
    room.gameObj.paddle2[0] -= paddle2;
    room.gameObj.paddle2[1][0] -= paddle2;
    room.gameObj.paddle2[1][1] -= paddle2;

    // 프레임 값 갱신
    room.gameObj.frameData[0] += 1;
    if (room.gameObj.frameData[0] === room.gameObj.frameData[1])
      room.gameObj.frameData[0] = 0;
    return room.gameObj;
  }
}
