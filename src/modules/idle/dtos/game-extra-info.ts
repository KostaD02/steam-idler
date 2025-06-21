import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { NameDto } from 'src/shared/dtos';
import { IdleExceptionKeys } from 'src/shared/types';

export class GameExtraInfoDto extends NameDto {
  @IsNotEmpty({
    message: IdleExceptionKeys.GameExtraInfoIsRequired,
  })
  @IsString({
    message: IdleExceptionKeys.GameExtraInfoShouldBeString,
  })
  @ApiProperty({
    description: 'Game name display',
    example: 'Idling',
  })
  gameExtraInfo: string;
}
