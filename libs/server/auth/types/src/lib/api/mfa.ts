export interface MfaTokenDto {
  token: string;
}

export interface MfaGenerateResponse {
  qrDataUrl: string;
  secret: string;
  otpauthUrl: string;
}

export interface MfaEnableResponse {
  recoveryCodes: string[];
}

export interface MfaChallengeResponse {
  mfaRequired: true;
}
