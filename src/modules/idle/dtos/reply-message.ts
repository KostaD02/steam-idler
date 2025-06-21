import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NameDto } from 'src/shared/dtos';
import { IdleExceptionKeys } from 'src/shared/types';

export class ReplyMessageDto extends NameDto {
  @IsNotEmpty({
    message: IdleExceptionKeys.ReplyMessageIsRequired,
  })
  @IsString({
    message: IdleExceptionKeys.ReplyMessageShouldBeString,
  })
  @ApiProperty({
    description: 'The message to reply while idle',
    example: 'Hello, My name is Inigo Montoya',
  })
  message: string;
}
