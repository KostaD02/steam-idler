export const SteamAccountExceptionKeys = {
  NotFound: 'errors.steam_account.not_found',
  UserAlreadyHasSteamAccount:
    'errors.steam_account.user_already_has_steam_account',
  LoginIsRequired: 'errors.steam_account.login_is_required',
  LoginShouldBeString: 'errors.steam_account.login_should_be_string',
  PasswordIsRequired: 'errors.steam_account.password_is_required',
  PasswordShouldBeString: 'errors.steam_account.password_should_be_string',
  TwoFactorCodeIsRequired: 'errors.steam_account.two_factor_code_is_required',
  TwoFactorCodeTooShort: 'errors.steam_account.two_factor_code_too_short',
  TwoFactorCodeTooLong: 'errors.steam_account.two_factor_code_too_long',
  TwoFactorCodeShouldBeString:
    'errors.steam_account.two_factor_code_should_be_string',
  LoginError: 'errors.steam_account.login_error',
  GuardCodeIsInvalid: 'errors.steam_account.guard_code_is_invalid',
  InvalidCredentials: 'errors.steam_account.invalid_credentials',
  RateLimitExceeded: 'errors.steam_account.rate_limit_exceeded',
} as const;
