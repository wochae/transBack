import { GameOptionDto } from 'src/game/dto/gameOption.dto';
import { UserObject } from 'src/entity/users.entity';

export class GameQueue {
  dataList: UserObject[];
  optionList: GameOptionDto[];
  rearHeadNumber: number;

  constructor() {
    this.dataList = [];
  }

  public Enqueue(player: UserObject, options: GameOptionDto) {}
  public DequeueData(): UserObject {
    const user = this.dataList[0];
    this.dataList.splice(0);
    return user;
  }
  public DequeueOptions(): GameOptionDto {
    const options = this.optionList[0];
    this.optionList.splice(0);
    return options;
  }
  public isEmpty(): boolean {
    return this.dataList.length == 0 ? true : false;
  }
  public size() {
    return this.dataList.length;
  }
}
