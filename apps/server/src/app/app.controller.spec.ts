import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
  });

  describe('base', () => {
    it('should return a welcome payload', () => {
      const appController = app.get<AppController>(AppController);
      const result = appController.base();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('swagger');
    });
  });

  describe('getErrorKeys', () => {
    it('should return an array of error keys', () => {
      const appController = app.get<AppController>(AppController);
      const result = appController.getErrorKeys();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
