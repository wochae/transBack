export enum Vector {
  UPRIGHT = 'upRight',
  UPLEFT = 'upLeft',
  DOWNRIGHT = 'downRight',
  DWONLEFT = 'downLeft',
}

export class GameBall {
  initX: number;
  initY: number;
  degreeX: number;
  degreeY: number;
  nextX: number;
  nextY: number;
  vector: Vector;
  isValid: boolean;

  constructor() {
    this.initX = 0;
    this.initY = 0;
    this.nextX = 0;
    this.nextY = 0;
    this.vector = Vector[Math.random() / 3];
    this.degreeX = this.getRandomInt(-2, 2);
    this.degreeY = this.getRandomInt(-2, 2);
  }

  public getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    let ret = Math.floor(Math.random() * (max - min + 1)) + min;
    if (ret == 0) ret = 1;
    return ret;
  }

  public resetBall() {
    this.initX = 0;
    this.initY = 0;
    this.nextX = 0;
    this.nextY = 0;
    this.vector = Vector[Math.random() / 3];
    this.degreeX = this.getRandomInt(-2, 2);
    this.degreeY = this.getRandomInt(-2, 2);
  }

  public predictUpRight(speed: number, { degreeX, degreeY }) {
    // 엄청난 수식
  }
  public predictUpLeft(speed: number, { degreeX, degreeY }) {
    // 엄청난 수식
  }
  public predictDownRight(speed: number, { degreeX, degreeY }) {
    // 엄청난 수식
  }
  public predictDonwLeft(speed: number, { degreeX, degreeY }) {
    // 엄청난 수식
  }
  public getPrediction(latency: number): any {
    const expectedTime = Date.now();
    const startTime = Date.now();
    //TODO: Latency 계산 구조
    return {
      animationStartDate: startTime,
      ballNextPosX: this.nextX,
      ballNextPosY: this.nextY,
      ballExpectedEventDate: expectedTime,
    };
  }

  public setValid(value: boolean) {
    this.isValid = value;
  }

  public getValid() {
    return this.isValid;
  }
}
