import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class TFAUserDto {
  @IsBoolean()
  authenticated?: boolean;
}

export class TFAuthDto {

  @IsInt()
  @IsOptional()
  code?: number;
}

export class SendEmailDto {
  userIdx: number;
  email: string;
}