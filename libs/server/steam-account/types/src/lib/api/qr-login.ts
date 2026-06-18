import { SteamAccountSummary } from '../steam-account';

export const QrLoginEventType = {
  Qr: 'qr',
  Scanned: 'scanned',
  Authenticated: 'authenticated',
  Failed: 'failed',
} as const;

export type QrLoginEventName =
  (typeof QrLoginEventType)[keyof typeof QrLoginEventType];

export interface QrLoginQrData {
  qrDataUrl: string;
}

export interface QrLoginErrorData {
  errorKey: string;
}

export type QrLoginAuthenticatedData = SteamAccountSummary;
