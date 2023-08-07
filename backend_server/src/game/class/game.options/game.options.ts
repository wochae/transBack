export class GameOptions {
  private speed: number;
  private mapNumber: number;

  constructor(speed: number, mapNumber: number) {
    this.speed = speed;
    this.mapNumber = mapNumber;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getMapNumber(): number {
    return this.mapNumber;
  }
}
