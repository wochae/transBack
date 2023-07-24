// FIXME: get, set 을 여기에 두는게 좋을까?
// Channel에 두는게 좋을까 ?
export class Message {
  /******************************* 멤버 변수 *******************************/
  private _channelIdx: number;
  private _sender: number;
  private _message: string;
  private _msgDate: Date;

  /******************************* 메서드 *******************************/
  constructor(channelIdx: number, sender: number, message: string) {
    this._channelIdx = channelIdx;
    this._sender = sender;
    this._message = message;
  }

  // getter
  get getChannelIdx(): number {
    return this._channelIdx;
  }
  get getSender(): number {
    return this._sender;
  }
  get getMsgDate(): Date {
    return this._msgDate;
  }

  // setter
  // set setChannelInfo(channelIdx: number, sender: number, message: string) {
  // FIXME: Dto 만들기
  set setChannelInfo(chatInfo: chatDTO) {
    // this.setChannelIdx(chatInfo.channelIdx);
    // this.setChannelIdx(chatInfo.channelIdx);
    // this.setSender = sender;
  }
  set setChannelIdx(channelIdx: number) {
    this._channelIdx = channelIdx;
  }
  set setSender(sender: number) {
    this._sender = sender;
  }
  set setMsgDate(msgDate: Date) {
    this._msgDate = msgDate;
  }
  // get getMessage(): string {
  //   return this._message;
  // }
  // set setMessage(message: string) {
  //   this._message = message;
  // }
}
