import { Controller, Get } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SKIP_LOGGING, SkipLogging } from './skip-logging.decorator';

describe('SkipLogging', () => {
  it('attaches the SKIP_LOGGING marker to a method', () => {
    class Target {
      @SkipLogging()
      handler(): string {
        return 'ok';
      }
    }

    const metadata = new Reflector().get<boolean>(
      SKIP_LOGGING,
      Target.prototype.handler,
    );

    expect(metadata).toBe(true);
  });

  it('attaches the SKIP_LOGGING marker to a class', () => {
    @SkipLogging()
    @Controller()
    class Target {
      @Get()
      handler(): string {
        return 'ok';
      }
    }

    const metadata = new Reflector().get<boolean>(SKIP_LOGGING, Target);

    expect(metadata).toBe(true);
  });

  it('leaves undecorated handlers without the marker', () => {
    class Target {
      handler(): string {
        return 'ok';
      }
    }

    const metadata = new Reflector().get<boolean>(
      SKIP_LOGGING,
      Target.prototype.handler,
    );

    expect(metadata).toBeUndefined();
  });
});
