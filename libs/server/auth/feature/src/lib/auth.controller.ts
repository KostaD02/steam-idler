import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Response } from 'express';

import { User } from '@steam-idler/server/auth/types';

import { AuthService } from './auth.service';
import { Auth, CurrentUser } from './decorators';
import { SignInDto, SignUpDto } from './dto';
import { LocalAuthGuard, RefreshJwtGuard } from './guards';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the currently authenticated user',
    description:
      'Resolves the user from the `access_token` cookie or `Authorization: Bearer <jwt>` header and returns the user document without the password hash.',
  })
  @ApiOkResponse({ description: 'Authenticated user profile.' })
  @ApiBadRequestResponse({
    description:
      'Access token is malformed or its signature does not verify. errorKey: `errors.auth.invalid_token`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the token no longer exists in the database. errorKey: `errors.auth.user_not_found`.',
  })
  getCurrentUser(@CurrentUser() user: User) {
    return this.authService.getSerializedUser(user);
  }

  @Post('sign-up')
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a user, sets `access_token` and `refresh_token` httpOnly cookies on the response, and returns both tokens in the body. The first user ever registered is promoted to `Admin`; later users default to `Standard`.',
  })
  @ApiCreatedResponse({
    description:
      'User created. Body: `{ access_token, refresh_token }`. Cookies are set on the response.',
  })
  @ApiBadRequestResponse({
    description:
      'Body validation failed. Possible errorKeys: `errors.auth.invalid_email`, `errors.auth.password_should_be_string`, `errors.auth.password_too_short`, `errors.auth.password_too_long`, `errors.auth.display_name_should_be_string`, `errors.auth.display_name_too_short`, `errors.auth.display_name_too_long`.',
  })
  @ApiConflictResponse({
    description:
      'An account with this email already exists. errorKey: `errors.auth.email_in_use`.',
  })
  signUp(
    @Body() signUpDto: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signUp(signUpDto, response);
  }

  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'Authenticate with email and password',
    description:
      'Validates credentials via the local Passport strategy, sets `access_token` and `refresh_token` httpOnly cookies, and returns both tokens.',
  })
  @ApiCreatedResponse({
    description:
      'Authenticated. Body: `{ access_token, refresh_token }`. Cookies are set on the response.',
  })
  @ApiBadRequestResponse({
    description:
      'Body validation or credential check failed. Possible errorKeys: `errors.auth.should_provide_email`, `errors.auth.should_provide_password`, `errors.auth.invalid_email`, `errors.auth.password_should_be_string`, `errors.auth.password_too_short`, `errors.auth.password_too_long`, `errors.auth.invalid_credentials` (returned when the password does not match).',
  })
  @ApiUnauthorizedResponse({
    description:
      'No account with the given email exists. errorKey: `errors.auth.invalid_credentials` (deliberately reuses the same key as the wrong-password case to avoid email enumeration).',
  })
  signIn(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() dto: SignInDto,
  ) {
    return this.authService.signIn(user, response);
  }

  @Post('sign-out')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sign out the current user',
    description:
      'Clears the `access_token` and `refresh_token` cookies. Requires a valid access token.',
  })
  @ApiCreatedResponse({ description: 'Signed out. Body: `{ success: true }`.' })
  @ApiBadRequestResponse({
    description:
      'Access token is malformed or its signature does not verify. errorKey: `errors.auth.invalid_token`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the token no longer exists. errorKey: `errors.auth.user_not_found`.',
  })
  signOut(@Res({ passthrough: true }) response: Response) {
    return this.authService.signOut(response);
  }

  @Post('refresh')
  @UseGuards(RefreshJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rotate access and refresh tokens',
    description:
      'Reads the refresh token from cookie, header, or body; verifies it; issues a new access/refresh pair and updates the cookies.',
  })
  @ApiCreatedResponse({
    description:
      'New token pair issued. Body: `{ access_token, refresh_token }`. Cookies are set on the response.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Refresh token missing, expired, or invalid. Possible errorKeys: `errors.auth.token_not_found`, `errors.auth.invalid_token`.',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the refresh token no longer exists. errorKey: `errors.auth.user_not_found`.',
  })
  refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refreshToken(request, response);
  }
}
