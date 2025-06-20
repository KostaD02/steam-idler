import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/schemas';
import { SignInDto } from './dtos';
import { SteamUserService } from 'src/shared/services';
import { NameDto } from 'src/shared/dtos';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly steamUserService: SteamUserService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<void> {
    const { name, password, twoFactorCode, autoRelogin } = signInDto;
    try {
      await this.steamUserService.signIn(
        name,
        password,
        twoFactorCode,
        autoRelogin,
      );
    } catch (error) {
      const err = error as Error;
      console.log(err.message);
      throw new UnauthorizedException(err.message);
    }
  }

  async signOut(nameDto: NameDto): Promise<void> {
    const { name } = nameDto;
    const user = await this.userModel.findOne({ name });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.steamUserService.logOut(user);
  }
}
