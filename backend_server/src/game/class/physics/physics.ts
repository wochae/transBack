import { FrameData } from 'src/game/enum/frame.data.enum';
import { GamePhase } from 'src/game/enum/game.phase';
import { KeyPress } from '../key.press/key.press';
import { GameData } from 'src/game/enum/game.data.enum';
import { Vector } from 'src/game/enum/game.vector.enum';
import { GameRoom } from '../game.room/game.room';
import { verify } from 'crypto';
import e from 'express';

export class Physics {
  private readonly MAX_WIDTH = 500;
  private readonly MIN_WIDTH = -500;
  private readonly MAX_HEIGHT = 250;
  private readonly MIN_HEIGTH = -250;
  private readonly PADDLE_LINE_1 = -470;
  private readonly PADDLE_LINE_2 = 470;

  constructor() {}

  checkPhysics(gameData: GameData, engine: Physics): GameData {
    engine.correctPaddleDatas(gameData.paddle1, engine);
    engine.correctPaddleDatas(gameData.paddle2, engine);
    // wall 부딪힘 여부 판단
    if (engine.checkHitTheWall(gameData.currentPos, gameData.vector, engine)) {
      gameData.gamePhase = GamePhase.HIT_THE_WALL;
      gameData = engine.correctLinearEquation(gameData, engine);
    }
    // 페들 부딪힘 여부 판단
    if (
      engine.checkHitThePaddle(gameData.currentPos, gameData.vector, engine)
    ) {
      if (engine.needToCorrection(gameData)) {
        gameData.gamePhase = GamePhase.HIT_THE_PADDLE;
        gameData = engine.correctLinearEquation(gameData, engine);
      }
    }
    // wall 부딪힘 여부 판단 재 판단(순간적으로 두번 부딪히는지 여부를 확인하기 위해)
    if (engine.checkHitTheWall(gameData.currentPos, gameData.vector, engine)) {
      gameData.gamePhase = GamePhase.HIT_THE_WALL;
      gameData = engine.correctLinearEquation(gameData, engine);
    }
    // Score 획득 여부 판단
    if (
      engine.checkHitTheGoalPost(gameData.currentPos, gameData.vector, engine)
    ) {
      gameData = engine.checkGameScore(gameData, engine);
    }
    return gameData;
  }

  private needToCorrection(gameData: GameData): boolean {
    let ret: boolean;
    ret = false;
    if (
      gameData.vector === Vector.UPLEFT ||
      gameData.vector === Vector.DOWNLEFT
    ) {
      if (
        gameData.paddle1[1][0] <= gameData.currentPos[1] &&
        gameData.paddle1[1][1] >= gameData.currentPos[1]
      )
        ret = true;
    } else {
      if (
        gameData.paddle2[1][0] <= gameData.currentPos[1] &&
        gameData.paddle2[1][1] >= gameData.currentPos[1]
      )
        ret = true;
    }
    return ret;
  }

  private correctLinearEquation(gameData: GameData, engine: Physics): GameData {
    if (gameData.gamePhase === GamePhase.HIT_THE_WALL) {
      gameData.anglePos[1] *= -1;
      gameData.standardPos = gameData.currentPos;
      if (
        gameData.vector === Vector.UPLEFT ||
        gameData.vector === Vector.UPRIGHT
      ) {
        gameData.vector += 2;
        gameData.standardPos[0] += gameData.anglePos[0];
        gameData.standardPos[1] += gameData.anglePos[1];
      } else if (
        gameData.vector === Vector.DOWNLEFT ||
        gameData.vector === Vector.DOWNRIGHT
      ) {
        gameData.vector -= 2;
        gameData.standardPos[0] += gameData.anglePos[0];
        gameData.standardPos[1] -= gameData.anglePos[1];
      }
    } else if (gameData.gamePhase === GamePhase.HIT_THE_PADDLE) {
      gameData.anglePos[0] *= -1;
      gameData.standardPos = gameData.currentPos;
      if (
        gameData.vector === Vector.UPLEFT ||
        gameData.vector === Vector.DOWNLEFT
      ) {
        gameData.vector += 1;
        if (
          gameData.paddle1[0] - 5 > gameData.currentPos[1] ||
          gameData.paddle1[0] + 5 < gameData.currentPos[1]
        )
          gameData.anglePos = engine.changeAngleForPaddle(gameData);

        // TODO: angle 보정치 전달
      } else if (
        gameData.vector === Vector.UPRIGHT ||
        gameData.vector === Vector.DOWNRIGHT
      ) {
        gameData.vector -= 1;
        if (
          gameData.paddle2[0] - 5 > gameData.currentPos[1] ||
          gameData.paddle2[0] + 5 < gameData.currentPos[1]
        )
          gameData.anglePos = engine.changeAngleForPaddle(gameData);
      }

      // 바뀐 벡터 기준에서 새로운 각도를 추가한다.
      gameData.standardPos[0] += gameData.anglePos[0];
      gameData.standardPos[1] += gameData.anglePos[1];
    }
    gameData.linearEquation[0] =
      (gameData.standardPos[1] - gameData.currentPos[1]) /
      (gameData.standardPos[0] - gameData.currentPos[0]);
    gameData.linearEquation[1] =
      gameData.standardPos[1] -
      gameData.linearEquation[0] * gameData.currentPos[0];
    return gameData;
  }

  private changeAngleForPaddle(gameData: GameData): [number, number] {
    switch (gameData.vector) {
      case Vector.UPRIGHT:
        if (gameData.anglePos[0] === 1 && gameData.anglePos[1] === -2) {
          return [-2, -1];
        } else if (gameData.anglePos[0] === 1 && gameData.anglePos[1] == -1) {
          return [-1, -2];
        } else {
          return [-1, -1];
        }
      case Vector.UPLEFT:
        if (gameData.anglePos[0] === -1 && gameData.anglePos[1] === -2) {
          return [2, -1];
        } else if (gameData.anglePos[0] === -1 && gameData.anglePos[1] === -1) {
          return [1, -2];
        } else {
          return [1, -1];
        }
      case Vector.DOWNRIGHT:
        if (gameData.anglePos[0] === 2 && gameData.anglePos[1] === 1) {
          return [-1, 2];
        } else if (gameData.anglePos[0] === 1 && gameData.anglePos[1] === 1) {
          return [-2, 1];
        } else {
          return [-1, 1];
        }
      case Vector.DOWNLEFT:
        if (gameData.anglePos[0] === -2 && gameData.anglePos[1] === 1) {
          return [1, 2];
        } else if (gameData.anglePos[0] === -1 && gameData.anglePos[1] === 1) {
          return [2, 1];
        } else {
          return [1, 1];
        }
    }
  }

  private checkGameScore(gameData: GameData, engine: Physics): GameData {
    if (
      gameData.vector === Vector.UPLEFT ||
      gameData.vector === Vector.DOWNLEFT
    ) {
      if (gameData.currentPos[0] - 20 <= engine.MIN_WIDTH) {
        gameData.score[1]++;
        gameData.gamePhase = GamePhase.HIT_THE_GOAL_POST;
      }
    } else {
      if (gameData.currentPos[0] + 20 >= engine.MAX_WIDTH) {
        gameData.score[0]++;
        gameData.gamePhase = GamePhase.HIT_THE_GOAL_POST;
      }
    }
    return gameData;
  }

  private correctPaddleDatas(
    paddle: [number, [number, number]],
    engine: Physics,
  ) {
    if (paddle[0] > 0) {
      if (paddle[1][1] >= engine.MAX_HEIGHT) {
        paddle[1][0] = engine.MAX_HEIGHT - 40;
        paddle[0] = engine.MAX_HEIGHT - 20;
        paddle[1][1] = engine.MAX_HEIGHT;
      }
    } else if (paddle[0] < 0) {
      if (paddle[1][0] <= engine.MIN_HEIGTH) {
        paddle[1][0] = engine.MIN_HEIGTH;
        paddle[0] = engine.MIN_HEIGTH + 20;
        paddle[1][1] = engine.MIN_HEIGTH + 40;
      }
    }
  }

  private checkHitTheWall(
    ballData: [number, number],
    vector: Vector,
    engine: Physics,
  ): boolean {
    let ret: boolean;
    ret = false;
    if (vector === Vector.DOWNLEFT || vector === Vector.DOWNRIGHT) {
      if (ballData[1] - 20 <= engine.MIN_HEIGTH) {
        ballData[1] = engine.MIN_HEIGTH + 20;
        ret = true;
      }
    } else if (vector === Vector.UPLEFT || vector === Vector.UPRIGHT) {
      if (ballData[1] + 20 >= engine.MAX_HEIGHT) {
        ballData[1] = engine.MAX_HEIGHT - 20;
        ret = true;
      }
    }

    return ret;
  }

  private checkHitThePaddle(
    ballData: [number, number],
    vector: Vector,
    engine: Physics,
  ): boolean {
    let ret: boolean;
    ret = false;
    if (vector === Vector.DOWNLEFT || vector === Vector.UPLEFT) {
      if (ballData[0] - 20 <= engine.PADDLE_LINE_1) {
        ballData[0] = engine.PADDLE_LINE_1 + 20;
        ret = true;
      }
    } else if (vector === Vector.DOWNRIGHT || vector === Vector.UPRIGHT) {
      if (ballData[0] + 20 >= engine.PADDLE_LINE_2) {
        ballData[0] = engine.PADDLE_LINE_2 - 20;
        ret = true;
      }
    }
    return ret;
  }

  private checkHitTheGoalPost(
    ballData: [number, number],
    vector: Vector,
    engine: Physics,
  ): boolean {
    let ret: boolean;
    ret = false;
    if (vector === Vector.DOWNLEFT || vector === Vector.UPLEFT) {
      if (ballData[0] - 20 <= engine.MIN_WIDTH) {
        ballData[0] = engine.MIN_WIDTH + 20;
        ret = true;
      }
    } else if (vector === Vector.DOWNRIGHT || vector === Vector.UPRIGHT) {
      if (ballData[0] + 20 >= engine.MAX_HEIGHT) {
        ballData[0] = engine.MAX_HEIGHT - 20;
        ret = true;
      }
    }
    return ret;
  }
}
