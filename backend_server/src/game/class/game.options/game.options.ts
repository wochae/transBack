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
export class GameOptions {
  private type: GameType;
  private speed: GameSpeed;
  private mapNumber: MapNumber;

  constructor(type: GameType, speed: GameSpeed, mapNumber: MapNumber) {
    this.type = type;
    this.speed = speed;
    this.mapNumber = mapNumber;
  }

  public getType(): GameType {
    return this.type;
  }

  public getSpeed(): GameSpeed {
    return this.speed;
  }

  public getMapNumber(): MapNumber {
    return this.mapNumber;
  }
}
