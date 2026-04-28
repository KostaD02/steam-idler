import { SetMetadata } from '@nestjs/common';

import { AUTH_TOKENS } from '@steam-idler/server/auth/core';

export const Public = () => SetMetadata(AUTH_TOKENS.IS_PUBLIC, true);
