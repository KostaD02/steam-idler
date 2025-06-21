import { Body, Controller, Patch } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IdleService } from './idle.service';
import { NameDto } from 'src/shared/dtos';
import { GameIdsDto } from './dtos';

@ApiTags('idle')
@Controller('idle')
export class IdleController {
  constructor(private readonly idleService: IdleService) {}

  @Patch('start')
  @ApiOkResponse({
    description: 'User started idling',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async startIdling(@Body() nameDto: NameDto): Promise<{ success: boolean }> {
    return this.idleService.startIdling(nameDto);
  }

  @Patch('stop')
  @ApiOkResponse({
    description: 'User stopped idling',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async stopIdling(@Body() nameDto: NameDto): Promise<{ success: boolean }> {
    return this.idleService.stopIdling(nameDto);
  }

  @Patch('games-to-idle')
  @ApiOkResponse({
    description: 'Games ids set to idle',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async gamesToIdle(
    @Body() gameIdsDto: GameIdsDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.gamesToIdle(gameIdsDto);
  }

  @Patch('clear-games')
  @ApiOkResponse({
    description: 'Games ids cleared',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async clearGames(@Body() nameDto: NameDto): Promise<{ success: boolean }> {
    return this.idleService.clearGames(nameDto);
  }
}
