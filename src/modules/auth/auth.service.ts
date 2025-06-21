import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas';
import { SignInDto } from './dtos';
import { ExpectionService, SteamUserService } from 'src/shared/services';
import { NameDto } from 'src/shared/dtos';
import { AuthExceptionKeys, StatusExceptionKeys } from 'src/shared/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly steamUserService: SteamUserService,
    private readonly expectionService: ExpectionService,
  ) {}

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ name: string; steamID: string }> {
    const { name, password, twoFactorCode, autoRelogin } = signInDto;
    try {
      const result = await this.steamUserService.signIn(
        name,
        password,
        twoFactorCode,
        autoRelogin,
      );
      return {
        name: result.accountInfo?.name || '',
        steamID: result.steamID?.getSteamID64() || '',
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
    const user = await this.userModel.findOne({ name });

    if (!user) {
      this.expectionService.throwException(
        StatusExceptionKeys.NotFound,
        'User not found',
        AuthExceptionKeys.UserNotFound,
      );
    }

    await this.steamUserService.logOut(user);
    return {
      success: true,
    };
  }
}
