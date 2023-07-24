import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';

export class CreateUsersDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @MinLength(1)
  @Matches(/^[a-zA-Z0-9]*$/, { message: 'intra is unique' })
  intra: string;
}
