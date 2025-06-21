import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { NameDto } from 'src/shared/dtos';
import { AuthExceptionKeys } from 'src/shared/types';

export class SignInDto extends NameDto {
  @IsString({
    message: AuthExceptionKeys.PasswordShouldBeString,
  })
  @IsNotEmpty({
    message: AuthExceptionKeys.PasswordIsRequired,
  })
  @ApiProperty({
    description: 'The password of the user to sign in',
    example: 'password',
  })
  password: string;

  @IsString({
    message: AuthExceptionKeys.TwoFactorCodeShouldBeString,
  })
  @IsNotEmpty({
    message: AuthExceptionKeys.TwoFactorCodeIsRequired,
  })
  @ApiProperty({
    description: 'The two factor code of the user to sign in',
    example: '123456',
  })
  twoFactorCode: string;

  @IsBoolean({
    message: AuthExceptionKeys.AutoReloginShouldBeBoolean,
  })
  @IsNotEmpty({
    message: AuthExceptionKeys.AutoReloginIsRequired,
  })
  @ApiProperty({
    description: 'Whether to automatically relogin the user',
    example: true,
  })
  autoRelogin: boolean;
}
