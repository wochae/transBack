import { IsEnum, IsIn, IsNumber } from 'class-validator';

export enum GameType {
  FRIEND = 'friend',
  NORMAL = 'normal match',
  RANK = 'rank match',
}

export enum GameSpeed {
  NORMAL = 'normal',
  FAST = 'fast',
  FATSTER = 'faster',
}

export enum MapNumber {
  A = 'map 0',
  B = 'map 1',
  C = 'map 2',
}

export class GameOptionDto {
  @IsEnum(GameType, {
    message: 'Is not invalid Enum.',
  })
  gameType: GameType;

  @IsNumber()
  userIdx: number;

  @IsEnum(GameSpeed, {
    message: 'Is not invalid Enum.',
  })
  speed: GameSpeed;

  @IsEnum(MapNumber, {
    message: 'Is not invalid Enum.',
  })
  mapNumber: MapNumber;
}
