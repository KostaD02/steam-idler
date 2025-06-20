export enum AuthExceptions {
  NameShouldBeString = 'error.name_should_be_string',
  NameIsRequired = 'error.name_is_required',
  PasswordShouldBeString = 'error.password_should_be_string',
  PasswordIsRequired = 'error.password_is_required',
  TwoFactorCodeShouldBeString = 'error.two_factor_code_should_be_string',
  TwoFactorCodeIsRequired = 'error.two_factor_code_is_required',
  AutoReloginShouldBeBoolean = 'error.auto_relogin_should_be_boolean',
  AutoReloginIsRequired = 'error.auto_relogin_is_required',
}
