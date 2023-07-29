import { Message } from '../message.class';

// FIXME: any type 을 적절하게 수정해야함
// FIXME: message -> messages 는 어떤지?
declare class Channel {
  /******************************* 멤버 변수 *******************************/
  private channelIdx: number;
  private roomId: number;
  private member: any; //   private member: member[];
  private message: Message[];
  private mode: string; // TODO: enum 으로 수정
  private owner: any; //   private owner: member;
  private admin: any; //   private admin: member[];
  private password: string;

  /******************************* 메서드 *******************************/
  // getter
  get getChannelIdx(): number;
  get getRoomId(): number;
  get getMember(): any; //   member: member[];
  get getMessages(): Message[];
  get getMode(): string; // TODO: enum 으로 수정
  get getOwner(): any; //   owner: member;
  get getAdmin(): any; //   admin: member[];
  get getPassword(): string;

  // setter
  set setChannelIdx(channelIdx: number);
  set setRoomId(roomId: number);
  set setMember(member: any); // member: member[];
  set setMessages(message: Message); // message: message[];
  set setMode(mode: string); // enum 으로 수정
  set setOwner(owner: any); // owner: member;
  set setAdmin(admin: any); // admin: member[];
  set setPassword(password: string);
}
