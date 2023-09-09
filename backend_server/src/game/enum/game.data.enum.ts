import { GameType, GameSpeed, MapNumber } from './game.type.enum';
import { Vector } from './game.vector.enum';
/**
 * 게임 구성요소를 나타내는 용도
 */
export interface GameData {
  currentPosX: number;
  currentPosY: number;
  angleX: number;
  angleY: number;
  standardX: number;
  standardY: number;
  currentFrame: number;
  maxFrame: number;
  angle: number; // y = ax + b, 'a'
  yIntercept: number; // y = ax + b, 'b'
  vector: Vector;
  paddle1: number;
  paddle1MaxMin: [number, number];
  paddle2: number;
  paddle2MaxMin: [number, number];
  gameType: GameType;
  gameSpeed: GameSpeed;
  gameMapNumber: MapNumber;
  score1: number;
  score2: number;
}
