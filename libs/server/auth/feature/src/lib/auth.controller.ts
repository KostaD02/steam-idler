import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
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
import {
  ChangePasswordDto,
  MfaTokenDto,
  SignInDto,
  SignUpDto,
  UpdateUserDto,
  UpdateUserSettingsDto,
} from './dto';
import { LocalAuthGuard, MfaPendingGuard, RefreshJwtGuard } from './guards';

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

  @Patch()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the currently authenticated user',
    description:
      'Patches whitelisted fields on the user resolved from the access token. Unknown fields are rejected by the global validation pipe; the body must contain at least one updatable field. Currently updatable: `displayName`.',
  })
  @ApiOkResponse({ description: 'Updated user profile.' })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or no updatable fields were provided. Possible errorKeys: `errors.auth.no_update_fields_provided`, `errors.auth.display_name_should_be_string`, `errors.auth.display_name_too_short`, `errors.auth.display_name_too_long`, `errors.auth.invalid_token`, `errors.common.property_should_not_exist`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`), missing/invalid (`errors.auth.invalid_credentials`), or issued before the latest password change (`errors.auth.password_changed`).',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the token no longer exists. errorKey: `errors.auth.user_not_found`.',
  })
  updateUser(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(user, dto);
  }

  @Patch('settings')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update the current user display settings',
    description:
      'Patches the boolean display preferences (`showProfileName`, `showProfileImage`, `maskAccountName`) on the user resolved from the access token. At least one field must be provided; unknown fields are rejected by the global validation pipe.',
  })
  @ApiOkResponse({ description: 'Updated user profile.' })
  @ApiBadRequestResponse({
    description:
      'Body validation failed or no updatable settings were provided. Possible errorKeys: `errors.auth.no_update_fields_provided`, `errors.auth.setting_should_be_boolean`, `errors.auth.invalid_token`, `errors.common.property_should_not_exist`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`), missing/invalid (`errors.auth.invalid_credentials`), or issued before the latest password change (`errors.auth.password_changed`).',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the token no longer exists. errorKey: `errors.auth.user_not_found`.',
  })
  updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserSettingsDto,
  ) {
    return this.authService.updateSettings(user, dto);
  }

  @Delete()
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete the currently authenticated user',
    description:
      'Removes the user resolved from the `access_token` cookie or `Authorization: Bearer <jwt>` header from the database, clears the `access_token` and `refresh_token` cookies, and returns `{ success: true }`.',
  })
  @ApiOkResponse({
    description: 'User deleted and signed out. Body: `{ success: true }`.',
  })
  @ApiBadRequestResponse({
    description:
      'Access token is malformed or its signature does not verify (`errors.auth.invalid_token`), or the delete operation was not acknowledged by the database (`errors.auth.user_not_found`).',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the token no longer exists in the database. errorKey: `errors.auth.user_not_found`.',
  })
  deleteUser(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.deleteUser(user, response);
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
      'Validates credentials via the local Passport strategy. If the account has two-factor authentication enabled, sets a short-lived `mfa_pending_token` cookie and returns `{ mfaRequired: true }` instead of a session; the client must then call `POST /auth/mfa/authenticate` with a code. Otherwise sets `access_token` and `refresh_token` httpOnly cookies and returns both tokens.',
  })
  @ApiCreatedResponse({
    description:
      'Authenticated. Body: `{ access_token, refresh_token }` (cookies set), or `{ mfaRequired: true }` when two-factor is enabled (an `mfa_pending_token` cookie is set instead).',
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

  @Patch('change-password')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change the current user password',
    description:
      'Verifies the old password, hashes the new one, persists it, then re-issues `access_token` and `refresh_token` so the active session continues with fresh credentials.',
  })
  @ApiCreatedResponse({
    description:
      'Password changed and tokens rotated. Body: `{ access_token, refresh_token }`. Cookies are updated on the response.',
  })
  @ApiBadRequestResponse({
    description:
      'Body validation failed, the old password did not match, or the new password equals the old. Possible errorKeys: `errors.auth.old_password_should_be_string`, `errors.auth.old_password_too_short`, `errors.auth.old_password_too_long`, `errors.auth.new_password_should_be_string`, `errors.auth.new_password_too_short`, `errors.auth.new_password_too_long`, `errors.auth.invalid_old_password`, `errors.auth.invalid_change_password`, `errors.auth.invalid_token`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Access token expired (`errors.auth.token_expired`) or no `req.user` resolved by the guard (`errors.auth.invalid_credentials`).',
  })
  @ApiNotFoundResponse({
    description:
      'User referenced by the token no longer exists. errorKey: `errors.auth.user_not_found`.',
  })
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.changePassword(user, dto, response);
  }

  @Post('mfa/generate')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Begin authenticator (TOTP) enrollment',
    description:
      'Generates a TOTP secret for the current user and returns a QR code data URL plus the raw secret for manual entry. The secret is stored but two-factor stays disabled until confirmed via `POST /auth/mfa/enable`.',
  })
  @ApiCreatedResponse({
    description:
      'Enrollment started. Body: `{ qrDataUrl, secret, otpauthUrl }`.',
  })
  @ApiConflictResponse({
    description:
      'Two-factor authentication is already enabled. errorKey: `errors.auth.mfa_already_enabled`.',
  })
  generateMfa(@CurrentUser() user: User, @Query('theme') theme?: string) {
    return this.authService.generateMfa(user, theme);
  }

  @Post('mfa/enable')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm and enable the authenticator',
    description:
      'Verifies a TOTP code against the pending secret and enables two-factor authentication. Returns one-time recovery codes that are shown only once.',
  })
  @ApiCreatedResponse({
    description: 'Two-factor enabled. Body: `{ recoveryCodes: string[] }`.',
  })
  @ApiBadRequestResponse({
    description:
      'The code is invalid or enrollment was not started. Possible errorKeys: `errors.auth.mfa_invalid_code`, `errors.auth.mfa_not_initialized`, `errors.auth.mfa_code_required`.',
  })
  @ApiConflictResponse({
    description:
      'Two-factor authentication is already enabled. errorKey: `errors.auth.mfa_already_enabled`.',
  })
  enableMfa(@CurrentUser() user: User, @Body() dto: MfaTokenDto) {
    return this.authService.enableMfa(user, dto.token);
  }

  @Post('mfa/disable')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Disable the authenticator',
    description:
      'Verifies a TOTP or recovery code, then removes the stored secret and recovery codes and turns two-factor authentication off.',
  })
  @ApiCreatedResponse({
    description: 'Two-factor disabled. Body: `{ success: true }`.',
  })
  @ApiBadRequestResponse({
    description:
      'Two-factor authentication is not enabled. errorKey: `errors.auth.mfa_not_enabled`.',
  })
  @ApiUnauthorizedResponse({
    description:
      'The verification code is invalid. errorKey: `errors.auth.mfa_invalid_code`.',
  })
  disableMfa(@CurrentUser() user: User, @Body() dto: MfaTokenDto) {
    return this.authService.disableMfa(user, dto.token);
  }

  @Post('mfa/authenticate')
  @UseGuards(MfaPendingGuard)
  @ApiOperation({
    summary: 'Complete sign-in with a two-factor code',
    description:
      'Exchanges the short-lived `mfa_pending_token` cookie (set by `POST /auth/sign-in` when two-factor is enabled) plus a TOTP or recovery code for a full session. Sets `access_token` and `refresh_token` cookies and clears the pending cookie.',
  })
  @ApiCreatedResponse({
    description:
      'Authenticated. Body: `{ access_token, refresh_token }`. Cookies are set on the response.',
  })
  @ApiUnauthorizedResponse({
    description:
      'The pending session is missing/expired or the code is invalid. Possible errorKeys: `errors.auth.mfa_required`, `errors.auth.invalid_token`, `errors.auth.mfa_invalid_code`.',
  })
  authenticateMfa(
    @CurrentUser() user: User,
    @Body() dto: MfaTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.authenticateMfa(user, dto.token, response);
  }
}
