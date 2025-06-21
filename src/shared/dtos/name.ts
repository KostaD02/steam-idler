import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthExceptionKeys } from '../types';

export class NameDto {
  @IsString({
    message: AuthExceptionKeys.NameShouldBeString,
  })
  @IsNotEmpty({
    message: AuthExceptionKeys.NameIsRequired,
  })
  @ApiProperty({
    description: 'The name of the user to sign in',
    example: 'kosta',
  })
  name: string;
}
