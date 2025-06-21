import { Injectable } from '@nestjs/common';
import { SignInDto } from './dtos';
import {
  UserService,
  ExpectionService,
  SteamUserService,
} from 'src/shared/services';
import { NameDto } from 'src/shared/dtos';
import { AuthExceptionKeys, StatusExceptionKeys } from 'src/shared/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly steamUserService: SteamUserService,
    private readonly expectionService: ExpectionService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<{ accountName: string }> {
    const { name, password, twoFactorCode, autoRelogin } = signInDto;
    try {
      await this.steamUserService.signIn(
        name,
        password,
        twoFactorCode,
        autoRelogin,
      );
      return {
        accountName: name,
      };
    } catch (error) {
      this.expectionService.throwException(
        StatusExceptionKeys.BadRequest,
        error.message as string,
        AuthExceptionKeys.InvalidCredentials,
      );
    }
  }

  async signOut(nameDto: NameDto): Promise<{ success: boolean }> {
    const { name } = nameDto;
    const user = await this.userService.getUserDocument(name);

    await this.steamUserService.logOut(user);
    return {
      success: true,
    };
  }
}
