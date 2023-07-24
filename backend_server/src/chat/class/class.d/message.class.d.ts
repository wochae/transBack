// FIXME: get, set 을 여기에 두는게 좋을까? Chat에 두는게 좋을까?
declare class Message {
  /******************************* 멤버 변수 *******************************/
  private _channelIdx: number;
  private _sender: number;
  private _message: string;
  private _msgDate: Date;

  /******************************* 메서드 *******************************/
  // getter
  get getChannelInfo(): any; // 필요할까? 필요하면 DTO?
  get getChannelIdx(): number;
  get getSender(): number;
  get getMsgDate(): Date;

  // setter
  set setChannelInfo(channelInfo: any); // 필요할까? 필요하면 DTO?
  set setChannelIdx(channelIdx: number);
  set setSender(sender: number);
  set setMsgDate(msgDate: Date);

  //   get getMessage(): string;
  //   set setMessage(message: string);
}
