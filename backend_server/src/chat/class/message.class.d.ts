declare class Message {
  /******************************* 멤버 변수 *******************************/
  private _channelIdx: number;
  private _sender: number;
  private _message: string;

  /******************************* 메서드 *******************************/
  // getter
  get getChannelInfo(): any; // 필요할까? 필요하면 DTO?
  get getChannelIdx(): number;
  get getSender(): number;
  get getMessage(): string;

  // setter
  set setChannelInfo(channelInfo: any); // 필요할까? 필요하면 DTO?
  set setChannelIdx(channelIdx: number);
  set setSender(sender: number);
  set setMessage(message: string);
}
