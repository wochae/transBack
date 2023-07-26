import { Message } from './message.class';

// FIXME: any type 을 적절하게 수정해야함
// FIXME: message -> messages 는 어떤지?
export class Channel {
  /******************************* 멤버 변수 *******************************/
  private channelIdx: number;
  private roomId: number;
  private member: any = []; //   private member: member[];
  private messages: Message[] = [];
  private mode: string; // TODO: enum 으로 수정
  private owner: any; //   private owner: member;
  private admin: any[] = []; //   private admin: member[];
  private password: string;

  /******************************* 메서드 *******************************/
  // TODO: 생성자가 필요할 듯 하다.
  // getter
  get getChannelIdx(): number {
    return this.channelIdx;
  }
  get getRoomId(): number {
    return this.roomId;
  }
  get getMember(): any {
    return this.member; //   member: member[];
  }
  get getMessages(): Message[] {
    return this.messages;
  }
  get getMode(): string {
    return this.mode; //   enum 으로 수정
  }
  get getOwner(): any {
    return this.owner; //   owner: member;
  }
  get getAdmin(): any {
    return this.admin; //   admin: member[];
  }
  get getPassword(): string {
    return this.password;
  }

  // setter
  set setChannelIdx(channelIdx: number) {
    this.channelIdx = channelIdx;
  }
  set setRoomId(roomId: number) {
    this.roomId = roomId;
  }
  set setMember(member: any[]) {
    this.member.push(member); // member: member[];
  }
  set setMessage(message: Message) {
    this.messages.push(message);
  }
  set setMode(mode: string) {
    this.mode = mode; // TODO: enum 으로 수정
  }
  set setOwner(owner: any) {
    this.owner = owner; // owner: member;
  }
  set setAdmin(admin: any) {
    this.admin.push(admin); // admin: member[];
  }
  set setPassword(password: string) {
    this.password = password;
  }
}
