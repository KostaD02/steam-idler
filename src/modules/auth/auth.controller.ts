import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
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
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('sign-out')
  signOut(@Body() nameDto: NameDto) {
    return this.authService.signOut(nameDto);
  }
}
