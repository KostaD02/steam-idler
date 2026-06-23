import { RefreshJwtGuard } from './refresh-jwt.guard';

describe('RefreshJwtGuard', () => {
  it('is a passport guard exposing canActivate', () => {
    const guard = new RefreshJwtGuard();

    expect(typeof guard.canActivate).toBe('function');
  });
});
