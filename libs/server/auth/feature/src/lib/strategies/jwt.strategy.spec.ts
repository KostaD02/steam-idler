import { JwtStrategy } from './jwt.strategy';

const setup = () => {
  const env = { get: jest.fn().mockReturnValue('jwt-secret') };
  const strategy = new JwtStrategy(env as never);

  return { strategy, env };
};

describe('JwtStrategy', () => {
  it('reads the JWT secret from the environment on construction', () => {
    const { env } = setup();

    expect(env.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  describe('validate', () => {
    it('returns the verified payload untouched', () => {
      const { strategy } = setup();
      const payload = { _id: 'user-id', role: 'admin' };

      expect(strategy.validate(payload)).toBe(payload);
    });
  });
});
