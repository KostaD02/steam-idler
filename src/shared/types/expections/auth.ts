export enum AuthExceptionKeys {
  NameShouldBeString = 'error.name_should_be_string',
  NameIsRequired = 'error.name_is_required',
  PasswordShouldBeString = 'error.password_should_be_string',
  PasswordIsRequired = 'error.password_is_required',
  TwoFactorCodeShouldBeString = 'error.two_factor_code_should_be_string',
  TwoFactorCodeIsRequired = 'error.two_factor_code_is_required',
  TwoFactorCodeIsInvalid = 'error.two_factor_code_is_invalid',
  AutoReloginShouldBeBoolean = 'error.auto_relogin_should_be_boolean',
  AutoReloginIsRequired = 'error.auto_relogin_is_required',
  UserAlreadyExists = 'error.user_already_exists',
  UserNotFound = 'error.user_not_found',
  InvalidCredentials = 'error.invalid_credentials',
}
