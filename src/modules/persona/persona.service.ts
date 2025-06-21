import { Injectable } from '@nestjs/common';
import { PersonaStateDto } from './dtos';
import { PersonaExceptionKeys, StatusExceptionKeys } from 'src/shared/types';
import {
  UserService,
  SteamUserService,
  ExpectionService,
} from 'src/shared/services';

@Injectable()
export class PersonaService {
  constructor(
    private readonly userService: UserService,
    private readonly steamUserService: SteamUserService,
    private readonly expectionService: ExpectionService,
  ) {}

  async setPersonaState(personaStateDto: PersonaStateDto): Promise<{
    success: boolean;
  }> {
    const { name, personaState } = personaStateDto;
    const personaStateNumber = Number(personaState);
    if (personaStateNumber < 0 || personaStateNumber > 7) {
      this.expectionService.throwException(
        StatusExceptionKeys.BadRequest,
        'Invalid persona state number (0-7 where 0 is Offline, 1 is Online, 2 is Busy, 3 is Away, 4 is Snooze, 5 is LookingToTrade, 6 is LookingToPlay, 7 is Invisible)',
        PersonaExceptionKeys.InvalidPersonaState,
      );
    }
    const user = await this.userService.getUserDocument(name);
    user.personaState = personaStateNumber;
    await user.save();
    this.steamUserService.updatePersona(user);
    return {
      success: true,
    };
  }
}
