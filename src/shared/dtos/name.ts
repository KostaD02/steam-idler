import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthExceptions } from '../types';

export class NameDto {
  @IsString({
    message: AuthExceptions.NameShouldBeString,
  })
  @IsNotEmpty({
    message: AuthExceptions.NameIsRequired,
  })
  @ApiProperty({
    description: 'The name of the user to sign in',
    example: 'John Doe',
  })
  name: string;
}
