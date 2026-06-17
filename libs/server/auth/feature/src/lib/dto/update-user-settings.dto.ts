import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsOptional } from 'class-validator';

import {
  AuthExpectionKeys,
  UpdateUserSettingsDto as UpdateUserSettingsDtoType,
} from '@steam-idler/server/auth/types';

import { ToBoolean } from './to-boolean.transform';

export class UpdateUserSettingsDto implements UpdateUserSettingsDtoType {
  @ApiProperty({
    required: false,
    default: true,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: AuthExpectionKeys.SettingShouldBeBoolean,
  })
  showProfileName?: boolean;

  @ApiProperty({
    required: false,
    default: true,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: AuthExpectionKeys.SettingShouldBeBoolean,
  })
  showProfileImage?: boolean;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsOptional()
  @ToBoolean()
  @IsBoolean({
    message: AuthExpectionKeys.SettingShouldBeBoolean,
  })
  maskAccountName?: boolean;
}
