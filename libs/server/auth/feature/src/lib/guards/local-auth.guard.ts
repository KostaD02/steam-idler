import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ExceptionService } from '@steam-idler/server/infra/services';
import { ExceptionStatusKeys } from '@steam-idler/server/infra/types';

import { AuthExpectionKeys, User } from '@steam-idler/server/auth/types';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(private readonly exceptionService: ExceptionService) {
    super();
  }

  override handleRequest<T = User>(
    err: Error,
    user: T,
    _: unknown,
    context: ExecutionContext,
  ) {
    const request = context.switchToHttp().getRequest();
    const { email, password } = request.body;

    if (err || !user) {
      if (!email && !password) {
        this.exceptionService.throw(
          ExceptionStatusKeys.BadRequest,
          'Should provide credentials',
          [
            AuthExpectionKeys.ShouldProvideEmail,
            AuthExpectionKeys.ShouldProvidePassword,
          ],
        );
      } else if (!email) {
        this.exceptionService.throw(
          ExceptionStatusKeys.BadRequest,
          'Email should be provided',
          [AuthExpectionKeys.ShouldProvideEmail],
        );
      } else if (!password) {
        this.exceptionService.throw(
          ExceptionStatusKeys.BadRequest,
          'Password should be provided',
          [AuthExpectionKeys.ShouldProvidePassword],
        );
      } else {
        throw err;
      }
    }

    return user;
  }
}
