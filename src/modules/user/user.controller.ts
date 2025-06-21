import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @ApiOkResponse({
    description: 'Get all active users data',
  })
  getUsers() {
    return this.userService.getUsers();
  }

  @Get(':name')
  @ApiParam({
    name: 'name',
    description: 'User name',
    example: 'kosta',
  })
  @ApiOkResponse({
    description: 'Get user data by name',
  })
  getUser(@Param('name') name: string) {
    return this.userService.getUserByName(name);
  }
}
