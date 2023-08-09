import { GameType, GameSpeed, MapNumber } from '../../enum/game.type.enum';
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
