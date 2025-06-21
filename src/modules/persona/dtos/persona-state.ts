import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { NameDto } from 'src/shared/dtos';
import { UserPersonaState, PersonaExceptionKeys } from 'src/shared/types';

export class PersonaStateDto extends NameDto {
  @IsEnum(UserPersonaState, {
    message: PersonaExceptionKeys.InvalidPersonaState,
  })
  @IsNotEmpty({
    message: PersonaExceptionKeys.PersonaStateIsRequired,
  })
  @ApiProperty({
    description:
      'The persona state to set (0-7 where 0 is Offline, 1 is Online, 2 is Busy, 3 is Away, 4 is Snooze, 5 is LookingToTrade, 6 is LookingToPlay, 7 is Invisible)',
    example: UserPersonaState.Online,
  })
  personaState: UserPersonaState;
}
