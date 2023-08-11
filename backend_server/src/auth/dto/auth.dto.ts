export interface IntraInfoDto {
    userIdx : number;
    imgUri: string;
  }
export class JwtPayloadDto {
  id: number;
  email: string;
};

export class CreateCertificateDto {
  token: string;
  check2Auth: boolean;
  email: string;
  userIdx: number;
};