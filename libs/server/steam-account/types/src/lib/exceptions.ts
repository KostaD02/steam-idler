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
  GamesIdsShouldBeArray: 'errors.steam_account.games_ids_should_be_array',
  GamesIdsMustBeNumbers: 'errors.steam_account.games_ids_must_be_numbers',
  InvalidPersonaStatus: 'errors.steam_account.invalid_persona_status',
  AutoReplyTemplateShouldBeString:
    'errors.steam_account.auto_reply_template_should_be_string',
  AutoReplyTemplateTooLong: 'errors.steam_account.auto_reply_template_too_long',
  AutoReplyWhileIdlingShouldBeBoolean:
    'errors.steam_account.auto_reply_while_idling_should_be_boolean',
  DisplayedGameNameShouldBeString:
    'errors.steam_account.displayed_game_name_should_be_string',
  DisplayedGameNameTooLong: 'errors.steam_account.displayed_game_name_too_long',
  CardsUnavailable: 'errors.steam_account.cards_unavailable',
  QrTimeout: 'errors.steam_account.qr_timeout',
  QrFailed: 'errors.steam_account.qr_failed',
} as const;
