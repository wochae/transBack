import { UserObject } from 'src/entity/users.entity';
import { Socket } from 'socket.io';

export class GamePlayer {
  private userObject: UserObject;
  private socket: Socket;

  constructor(user: UserObject) {
    this.userObject = user;
    this.socket = null;
  }

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  getUserObject() {
    return this.userObject;
  }

  emitToClient(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
