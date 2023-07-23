import { Message } from './message.class';

// FIXME: private 에 _ 붙이는 거 어떻게 생각하는지..?
// FIXME: any type 을 적절하게 수정해야함
// FIXME: message -> messages 는 어떤지?
export class Channel {
  /******************************* 멤버 변수 *******************************/
  private _channelIdx: number;
  private _roomId: number;
  private _member: any; //   private member: member[];
  private _messages: Message[];
  private _mode: string; // enum 으로 수정
  private _owner: any; //   private owner: member;
  private _admin: any; //   private admin: member[];
  private _password: string;

  /******************************* 메서드 *******************************/
  // getter
  get getChannelIdx(): number {
    return this._channelIdx;
  }
  get getRoomId(): number {
    return this._roomId;
  }
  get getMember(): any {
    return this._member; //   member: member[];
  }
  get getMessages(): Message[] {
    return this._messages;
  }
  get getMode(): string {
    return this._mode; //   enum 으로 수정
  }
  get getOwner(): any {
    return this._owner; //   owner: member;
  }
  get getAdmin(): any {
    return this._admin; //   admin: member[];
  }
  get getPassword(): string {
    return this._password;
  }

  // setter
  set setChannelIdx(channelIdx: number) {
    this._channelIdx = channelIdx;
  }
  set setRoomId(roomId: number) {
    this._roomId = roomId;
  }
  set setMember(member: any) {
    this._member = member; // member: member[];
  }
  set setMessage(message: Message) {
    this._messages.push(message);
  }
  set setMode(mode: string) {
    this._mode = mode; // enum 으로 수정
  }
  set setOwner(owner: any) {
    this._owner = owner; // owner: member;
  }
  set setAdmin(admin: any) {
    this._admin = admin; // admin: member[];
  }
  set setPassword(password: string) {
    this._password = password;
  }
}
