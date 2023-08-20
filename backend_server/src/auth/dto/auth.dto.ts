export class IntraSimpleInfoDto {
  constructor(userIdx: number, imgUri: string, check2Auth: boolean) {
    this.userIdx = userIdx;
    this.imgUri = imgUri;
    this.check2Auth = check2Auth;
  }
    userIdx : number;
    imgUri: string;
    check2Auth: boolean;
  }
export class JwtPayloadDto {
  id: number;
  email: string;
};

export class CreateCertificateDto {
  constructor(token: string, check2Auth: boolean, email: string, userIdx: number) {
    this.token = token;
    this.check2Auth = check2Auth;
    this.email = email;
    this.userIdx = userIdx;
  }
  token: string;
  check2Auth: boolean;
  email: string;
  userIdx: number;
};