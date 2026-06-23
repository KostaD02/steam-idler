import { AuthHelperService } from './auth-helper.service';

const setup = (jwtExpiresIn: string | undefined = '60') => {
  const env = { get: jest.fn().mockReturnValue(jwtExpiresIn) };
  const jwtService = { sign: jest.fn(), verify: jest.fn() };
  const service = new AuthHelperService(env as never, jwtService as never);

  return { service, env, jwtService };
};

describe('AuthHelperService', () => {
  describe('calculateJWTExpirationDate', () => {
    it('adds the configured offset scaled by the multiplier to now', () => {
      const { service, env } = setup('60');
      jest.spyOn(Date, 'now').mockReturnValue(1_000);

      const result = service.calculateJWTExpirationDate(1_000);

      expect(env.get).toHaveBeenCalledWith('JWT_EXPIRES_IN');
      expect(result).toBe(1_000 + 60 * 1_000);

      jest.restoreAllMocks();
    });

    it('treats a missing configuration value as not-a-number', () => {
      const env = { get: jest.fn().mockReturnValue(undefined) };
      const service = new AuthHelperService(env as never, {} as never);

      expect(Number.isNaN(service.calculateJWTExpirationDate(1_000))).toBe(
        true,
      );
    });
  });
});
