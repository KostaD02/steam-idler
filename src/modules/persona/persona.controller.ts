import { Body, Controller, Patch } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import { PersonaStateDto } from './dtos';

@ApiTags('persona')
@Controller('persona')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Patch('state')
  @ApiOkResponse({
    description: 'Persona state set',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async setPersonaState(@Body() personaStateDto: PersonaStateDto): Promise<{
    success: boolean;
  }> {
    return this.personaService.setPersonaState(personaStateDto);
  }
}
