import { MessageEvent } from '@nestjs/common';

import { toDataURL } from 'qrcode';
import { firstValueFrom, toArray } from 'rxjs';

import { SteamQrService } from './steam-qr.service';

let lastSession: MockLoginSession;

class MockLoginSession {
  loginTimeout = 0;
  accountName = 'qr-account';
  refreshToken = 'refresh-token';
  private handlers = new Map<string, (payload?: unknown) => void>();
  on = jest.fn((event: string, handler: (payload?: unknown) => void) => {
    this.handlers.set(event, handler);
  });
  startWithQR = jest
    .fn()
    .mockResolvedValue({ qrChallengeUrl: 'https://s.team/qr' });
  cancelLoginAttempt = jest.fn();
  removeAllListeners = jest.fn();

  emit(event: string, payload?: unknown): void {
    this.handlers.get(event)?.(payload);
  }
}

jest.mock('steam-session', () => ({
  EAuthTokenPlatformType: { SteamClient: 'SteamClient' },
  LoginSession: jest.fn().mockImplementation(() => {
    lastSession = new MockLoginSession();

    return lastSession;
  }),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,qr'),
}));

const mockedToDataURL = toDataURL as jest.MockedFunction<typeof toDataURL>;

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const setup = () => {
  const steamUserService = {
    createAccountFromRefreshToken: jest
      .fn()
      .mockResolvedValue({ accountName: 'qr-account' }),
  };
  const steamAccountRepository = {
    existsByName: jest.fn().mockResolvedValue(false),
  };

  const service = new SteamQrService(
    steamUserService as never,
    steamAccountRepository as never,
  );

  return { service, steamUserService, steamAccountRepository };
};

describe('SteamQrService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLoginStream', () => {
    it('emits a qr event with the generated data url once the session starts', async () => {
      const { service } = setup();
      const events: MessageEvent[] = [];

      const subscription = service
        .createLoginStream('user-id' as never)
        .subscribe((event) => events.push(event));

      await flush();

      expect(mockedToDataURL).toHaveBeenCalledWith(
        'https://s.team/qr',
        expect.objectContaining({ width: 256 }),
      );
      expect(events).toEqual([
        { type: 'qr', data: { qrDataUrl: 'data:image/png;base64,qr' } },
      ]);

      subscription.unsubscribe();
    });

    it('uses the dark palette when the dark theme is requested', async () => {
      const { service } = setup();

      const subscription = service
        .createLoginStream('user-id' as never, 'dark')
        .subscribe();

      await flush();

      expect(mockedToDataURL).toHaveBeenCalledWith(
        'https://s.team/qr',
        expect.objectContaining({
          color: { dark: '#ccd6f6', light: '#112240' },
        }),
      );

      subscription.unsubscribe();
    });

    it('emits a scanned event on remote interaction', async () => {
      const { service } = setup();
      const events: MessageEvent[] = [];

      const subscription = service
        .createLoginStream('user-id' as never)
        .subscribe((event) => events.push(event));

      await flush();
      lastSession.emit('remoteInteraction');

      expect(events).toContainEqual({ type: 'scanned', data: {} });

      subscription.unsubscribe();
    });

    it('emits authenticated and completes when login finalizes', async () => {
      const { service, steamUserService } = setup();

      const collected = firstValueFrom(
        service.createLoginStream('user-id' as never).pipe(toArray()),
      );

      await flush();
      lastSession.emit('authenticated');
      const events = await collected;

      expect(
        steamUserService.createAccountFromRefreshToken,
      ).toHaveBeenCalledWith('qr-account', 'refresh-token', 'user-id');
      expect(events).toContainEqual({
        type: 'authenticated',
        data: { accountName: 'qr-account' },
      });
    });

    it('fails when the account already exists', async () => {
      const { service, steamAccountRepository, steamUserService } = setup();
      steamAccountRepository.existsByName.mockResolvedValue(true);

      const collected = firstValueFrom(
        service.createLoginStream('user-id' as never).pipe(toArray()),
      );

      await flush();
      lastSession.emit('authenticated');
      const events = await collected;

      expect(
        steamUserService.createAccountFromRefreshToken,
      ).not.toHaveBeenCalled();
      expect(events).toContainEqual({
        type: 'failed',
        data: {
          errorKey: 'errors.steam_account.user_already_has_steam_account',
        },
      });
    });

    it('fails with a timeout error key when the session times out', async () => {
      const { service } = setup();
      const events: MessageEvent[] = [];

      const subscription = service
        .createLoginStream('user-id' as never)
        .subscribe((event) => events.push(event));

      await flush();
      lastSession.emit('timeout');

      expect(events).toContainEqual({
        type: 'failed',
        data: { errorKey: 'errors.steam_account.qr_timeout' },
      });

      subscription.unsubscribe();
    });

    it('fails when the session emits an error', async () => {
      const { service } = setup();
      const events: MessageEvent[] = [];

      const subscription = service
        .createLoginStream('user-id' as never)
        .subscribe((event) => events.push(event));

      await flush();
      lastSession.emit('error', new Error('boom'));

      expect(events).toContainEqual({
        type: 'failed',
        data: { errorKey: 'errors.steam_account.qr_failed' },
      });

      subscription.unsubscribe();
    });

    it('fails when the qr challenge url is missing', async () => {
      const { service } = setup();
      const events: MessageEvent[] = [];

      const subscription = service
        .createLoginStream('user-id' as never)
        .subscribe((event) => events.push(event));

      lastSession.startWithQR.mockResolvedValueOnce({ qrChallengeUrl: '' });
      await flush();

      subscription.unsubscribe();
    });

    it('cancels the login attempt when the subscriber unsubscribes', async () => {
      const { service } = setup();

      const subscription = service
        .createLoginStream('user-id' as never)
        .subscribe();

      await flush();
      const session = lastSession;
      subscription.unsubscribe();

      expect(session.removeAllListeners).toHaveBeenCalled();
      expect(session.cancelLoginAttempt).toHaveBeenCalled();
    });
  });
});
