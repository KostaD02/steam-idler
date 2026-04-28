import { SteamIdlerValidator, USER_EMAIL_REGEX } from '@steam-idler/infra';

export const UserEmailValidator: SteamIdlerValidator<string> = {
  name: 'email',
  validator: (value): boolean => {
    return USER_EMAIL_REGEX.test(value);
  },
};
