import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CONFIG } from 'src/shared/consts';
import { UserPersonaState } from 'src/shared/types';

@Schema({
  versionKey: false,
})
export class User {
  @Prop({
    required: true,
    minlength: CONFIG.MINIMUM_LOGIN_NAME_LENGTH,
  })
  name: string;

  @Prop({
    required: false,
    default: false,
  })
  idleGames: boolean;

  @Prop({
    required: false,
    default: '',
  })
  customGameExtraInfo: string;

  @Prop({
    required: false,
    default: false,
  })
  replyMessageWhileIdle: boolean;

  @Prop({
    required: false,
    default: '',
  })
  replyMessageTemplate: string;

  @Prop({
    required: false,
    min: 0,
    max: 7,
    default: UserPersonaState.Online,
  })
  personaState: UserPersonaState;

  @Prop({
    required: false,
    default: [],
    type: [Number],
  })
  gameIds: number[];

  @Prop({
    required: false,
    default: '',
  })
  steamRefreshToken: string;

  @Prop({
    required: false,
    default: '',
  })
  steamMachineAuthToken: string;

  @Prop({
    required: false,
    default: '',
  })
  steamID: string;

  @Prop({
    required: false,
    default: [],
    type: [String],
  })
  steamCookies: string[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
