import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsNotEmpty } from 'class-validator';
import { NameDto } from 'src/shared/dtos';
import { IdleExceptionKeys } from 'src/shared/types/expections';

export class GameIdsDto extends NameDto {
  @IsArray({
    message: IdleExceptionKeys.GameIdsShouldBeArray,
  })
  @IsNumber(
    {},
    { each: true, message: IdleExceptionKeys.GameIdsShouldBeNumbers },
  )
  @IsNotEmpty({
    message: IdleExceptionKeys.GameIdsIsRequired,
  })
  @ApiProperty({
    description:
      'The game IDs to idle (check https://steamdb.info/ for the list of game IDs)',
    type: [Number],
    example: [1245620, 2622380],
  })
  gameIds: number[];
}
