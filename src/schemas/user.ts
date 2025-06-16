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
  customNameWhileIdle: string;

  @Prop({
    required: false,
    default: '',
  })
  customNameBeforeIdle: string;

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
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
