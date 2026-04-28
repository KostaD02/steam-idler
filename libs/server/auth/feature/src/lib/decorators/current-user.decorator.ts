import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '@steam-idler/server/auth/types';

export const CurrentUser = createParamDecorator(
  async (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user as User;
  },
);
