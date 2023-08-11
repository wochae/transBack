export class IntraSimpleInfoDto {
  constructor(userIdx: number, imgUri: string) {
    this.userIdx = userIdx;
    this.imgUri = imgUri;
  }
    userIdx : number;
    imgUri: string;
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