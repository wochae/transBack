import { FrameData } from 'src/game/enum/frame.data.enum';
import { GamePhase } from 'src/game/enum/game.phase';
import { KeyPress } from '../key.press/key.press';
import { GameData } from 'src/game/enum/game.data.enum';
import { Vector } from 'src/game/enum/game.vector.enum';
import { GameRoom } from '../game.room/game.room';

export class Physics {
  private readonly MAX_WIDTH = 500;
  private readonly min_WIDTH = -500;
  private readonly MAX_HEIGHT = 250;
  private readonly min_HEIGHT = -250;
  private readonly PADDLE_LINE_1 = -470;
  private readonly PADDLE_LINE_2 = 470;

  constructor() {}
}