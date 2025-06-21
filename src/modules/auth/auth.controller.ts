import { Body, Controller, Delete, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos';
import { NameDto } from 'src/shared/dtos';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @ApiBody({
    type: SignInDto,
    description: 'Sign in to your account',
    examples: {
      'application/json': {
        value: {
          name: '',
          password: '',
          twoFactorCode: '123456',
          autoRelogin: true,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'User signed in successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials',
  })
  @ApiConflictResponse({
    description: 'User already exists with this name',
  })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Delete('sign-out')
  @ApiOkResponse({
    description: 'User signed out successfully',
  })
  signOut(@Body() nameDto: NameDto) {
    return this.authService.signOut(nameDto);
  }
}
