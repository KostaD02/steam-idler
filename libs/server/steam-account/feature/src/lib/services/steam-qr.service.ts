import { Injectable, Logger, MessageEvent } from '@nestjs/common';

import { toDataURL } from 'qrcode';
import { Observable, Subscriber } from 'rxjs';
import { EAuthTokenPlatformType, LoginSession } from 'steam-session';

import { MongoId } from '@steam-idler/server/infra/types';

import { SteamAccountRepository } from '@steam-idler/server/steam-account/domain';
import {
  QrLoginEventType,
  SteamAccountExceptionKeys,
} from '@steam-idler/server/steam-account/types';

import { SteamUserService } from './steam-user.service';

const QR_LOGIN_TIMEOUT_MS = 180_000;

const QR_COLORS = {
  light: { dark: '#0a192f', light: '#ffffff' },
  dark: { dark: '#ccd6f6', light: '#112240' },
} as const;

@Injectable()
export class SteamQrService {
  private readonly logger = new Logger(SteamQrService.name);

  constructor(
    private readonly steamUserService: SteamUserService,
    private readonly steamAccountRepository: SteamAccountRepository,
  ) {}

  createLoginStream(userId: MongoId, theme?: string): Observable<MessageEvent> {
    const color = theme === 'dark' ? QR_COLORS.dark : QR_COLORS.light;

    return new Observable<MessageEvent>((subscriber) => {
      const session = new LoginSession(EAuthTokenPlatformType.SteamClient);

      session.loginTimeout = QR_LOGIN_TIMEOUT_MS;

      const fail = (errorKey: string) => {
        subscriber.next({
          type: QrLoginEventType.Failed,
          data: { errorKey },
        });
        subscriber.complete();
      };

      session.on('remoteInteraction', () => {
        subscriber.next({ type: QrLoginEventType.Scanned, data: {} });
      });

      session.on('authenticated', () => {
        void this.finalize(session, userId, subscriber, fail);
      });

      session.on('timeout', () => {
        fail(SteamAccountExceptionKeys.QrTimeout);
      });

      session.on('error', (error) => {
        this.logger.error('QR login session error', error);
        fail(SteamAccountExceptionKeys.QrFailed);
      });

      session
        .startWithQR()
        .then(async ({ qrChallengeUrl }) => {
          if (!qrChallengeUrl) {
            fail(SteamAccountExceptionKeys.QrFailed);

            return;
          }

          const qrDataUrl = await toDataURL(qrChallengeUrl, {
            color,
            margin: 2,
            width: 256,
          });
          subscriber.next({
            type: QrLoginEventType.Qr,
            data: { qrDataUrl },
          });
        })
        .catch((error) => {
          this.logger.error('Failed to start QR login session', error);
          fail(SteamAccountExceptionKeys.QrFailed);
        });

      return () => {
        session.removeAllListeners();

        try {
          session.cancelLoginAttempt();
        } catch {
          // The session may already be settled; nothing to cancel.
        }
      };
    });
  }

  private async finalize(
    session: LoginSession,
    userId: MongoId,
    subscriber: Subscriber<MessageEvent>,
    fail: (errorKey: string) => void,
  ) {
    try {
      const { accountName, refreshToken } = session;

      const exists =
        await this.steamAccountRepository.existsByName(accountName);

      if (exists) {
        fail(SteamAccountExceptionKeys.UserAlreadyHasSteamAccount);
        return;
      }

      const account = await this.steamUserService.createAccountFromRefreshToken(
        accountName,
        refreshToken,
        userId,
      );

      subscriber.next({
        type: QrLoginEventType.Authenticated,
        data: account,
      });
      subscriber.complete();
    } catch (error) {
      this.logger.error('Failed to finalize QR login', error);
      fail(SteamAccountExceptionKeys.QrFailed);
    }
  }
}
