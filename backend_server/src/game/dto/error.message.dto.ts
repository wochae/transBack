export class ReturnMsgDto {
  code: string;
  msg: string;

  constructor(code: number, msg: string) {
    this.code = code.toString();
    this.msg = msg;
  }
}
