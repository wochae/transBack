import { UserObject } from 'src/entity/users.entity';
import { Socket } from 'socket.io';
import { GameOptionDto } from '../../dto/game.option.dto';

export class GamePlayer {
  private userObject: UserObject;
  private socket: Socket | null;
  private options: GameOptionDto | null;

  constructor(user: UserObject) {
    this.userObject = user;
    this.socket = null;
    this.options = null;
  }

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  setOptions(data: GameOptionDto) {
    this.options = data;
  }

  getUserObject() {
    return this.userObject;
  }

  emitToClient(event: string, data: any) {
    if (this.socket instanceof Socket) this.socket.emit(event, data);
  }
}
