export class UserDto {
  userIdx: number;
  displayName: string;

  imgUri: string;
  rating: number;
  mfaNeed: boolean;
};

export class IntraInfoDto {
  constructor(userIdx: number, intra: string, imgUri: string, accessToken: string, email: string,
  ) {
    this.userIdx = userIdx;
    this.intra = intra;
    this.imgUri = imgUri;
    this.accessToken = accessToken;
    this.email = email;
  }
  userIdx: number;
  intra: string;
  imgUri: string;
  accessToken: string;
  email: string;
}