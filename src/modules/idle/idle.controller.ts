import { Body, Controller, Delete, Patch } from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdleService } from './idle.service';
import { NameDto } from 'src/shared/dtos';
import { GameExtraInfoDto, GameIdsDto, ReplyMessageDto } from './dtos';

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

  @Patch('custom-game-name-display')
  @ApiOkResponse({
    description: 'Custom game name display set',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async setCustomGameNameDisplay(
    @Body() gameExtraInfoDto: GameExtraInfoDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.setGameExtraInfo(gameExtraInfoDto);
  }

  @Delete('custom-game-name-display')
  @ApiOkResponse({
    description: 'Custom game name display removed',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async removeCustomGameNameDisplay(
    @Body() nameDto: NameDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.removeGameExtraInfo(nameDto);
  }

  @Patch('message/reply/start')
  @ApiOkResponse({
    description: 'Message while idle started',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async startMessageWhileIdle(
    @Body() nameDto: NameDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.setMessageWhileIdle(nameDto, true);
  }

  @Patch('message/reply/stop')
  @ApiOkResponse({
    description: 'Message while idle stopped',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async stopMessageWhileIdle(
    @Body() nameDto: NameDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.setMessageWhileIdle(nameDto, false);
  }

  @Patch('message/reply/template-set')
  @ApiBody({
    type: ReplyMessageDto,
    description: 'Set reply message template',
    examples: {
      'application/json': {
        value: {
          name: 'kosta',
          message: 'Hello, My name is Inigo Montoya',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Message while idle template set',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async setReplyMessageTemplate(
    @Body() replyMessageDto: ReplyMessageDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.setReplyMessage(replyMessageDto);
  }

  @Delete('message/reply/template-clear')
  @ApiOkResponse({
    description: 'Message while idle template cleared',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  async clearReplyMessageTemplate(
    @Body() nameDto: NameDto,
  ): Promise<{ success: boolean }> {
    return this.idleService.clearReplyMessage(nameDto);
  }
}
