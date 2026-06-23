jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { hash, compare } from 'bcrypt';

import { hashText, compareToHash } from './encryption';

const hashMock = hash as jest.MockedFunction<typeof hash>;
const compareMock = compare as jest.MockedFunction<typeof compare>;

describe('encryption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashText', () => {
    it('hashes the input with the default salt rounds', async () => {
      hashMock.mockResolvedValue('hashed-value' as never);

      const result = await hashText('secret');

      expect(hashMock).toHaveBeenCalledWith('secret', 10);
      expect(result).toBe('hashed-value');
    });

    it('forwards a custom salt rounds value', async () => {
      hashMock.mockResolvedValue('hashed-value' as never);

      await hashText('secret', 14);

      expect(hashMock).toHaveBeenCalledWith('secret', 14);
    });

    it('propagates rejections from bcrypt', async () => {
      hashMock.mockRejectedValue(new Error('hash failed') as never);

      await expect(hashText('secret')).rejects.toThrow('hash failed');
    });
  });

  describe('compareToHash', () => {
    it('compares the input against the hashed text', async () => {
      compareMock.mockResolvedValue(true as never);

      const result = await compareToHash('secret', 'hashed-value');

      expect(compareMock).toHaveBeenCalledWith('secret', 'hashed-value');
      expect(result).toBe(true);
    });

    it('returns false when the input does not match', async () => {
      compareMock.mockResolvedValue(false as never);

      const result = await compareToHash('wrong', 'hashed-value');

      expect(result).toBe(false);
    });

    it('propagates rejections from bcrypt', async () => {
      compareMock.mockRejectedValue(new Error('compare failed') as never);

      await expect(compareToHash('secret', 'hashed-value')).rejects.toThrow(
        'compare failed',
      );
    });
  });
});
