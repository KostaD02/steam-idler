import { HttpStatus } from '@nestjs/common';

export const ExceptionStatusKeys = {
  NotFound: 'errors.not_found',
  Forbidden: 'errors.forbidden',
  BadRequest: 'errors.bad_request',
  PaymentRequired: 'errors.payment_required',
  Unauthorized: 'errors.unauthorized',
  Conflict: 'errors.conflict',
  Teapot: 'errors.teapot',
  PayloadTooLarge: 'errors.payload_too_large',
  UnsupportedMediaType: 'errors.unsupported_media_type',
  EnhanceYourCalm: 'errors.enhance_your_calm',
  TooManyRequests: 'errors.too_many_requests',
  InternalServerError: 'errors.internal_server_error',
} as const;

export const ExceptionStatusCodesKeys: Record<
  (typeof ExceptionStatusKeys)[keyof typeof ExceptionStatusKeys],
  number
> = {
  [ExceptionStatusKeys.BadRequest]: HttpStatus.BAD_REQUEST,
  [ExceptionStatusKeys.Forbidden]: HttpStatus.FORBIDDEN,
  [ExceptionStatusKeys.NotFound]: HttpStatus.NOT_FOUND,
  [ExceptionStatusKeys.PaymentRequired]: HttpStatus.PAYMENT_REQUIRED,
  [ExceptionStatusKeys.Unauthorized]: HttpStatus.UNAUTHORIZED,
  [ExceptionStatusKeys.Conflict]: HttpStatus.CONFLICT,
  [ExceptionStatusKeys.Teapot]: HttpStatus.I_AM_A_TEAPOT,
  [ExceptionStatusKeys.PayloadTooLarge]: HttpStatus.PAYLOAD_TOO_LARGE,
  [ExceptionStatusKeys.UnsupportedMediaType]: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  [ExceptionStatusKeys.EnhanceYourCalm]: 420,
  [ExceptionStatusKeys.TooManyRequests]: HttpStatus.TOO_MANY_REQUESTS,
  [ExceptionStatusKeys.InternalServerError]: HttpStatus.INTERNAL_SERVER_ERROR,
} as const;

export type ExceptionStatusKey =
  (typeof ExceptionStatusKeys)[keyof typeof ExceptionStatusKeys];

export const CommonExpectionsKeys = {
  AppError: 'errors.common.app_error',
  EndPointNotFound: 'errors.common.endpoint_not_found',
  InvalidJSON: 'errors.common.invalid_json',
  IncorrectMongooseID: 'errors.common.incorrect_mongoose_id',
  PropertyShouldNotExist: 'errors.common.property_should_not_exist',
  EventPayloadRequired: 'errors.common.event_payload_required',
} as const;

export type HttpExceptionResponse = {
  error: string;
  status: number;
  message?: string | string[];
  errorKeys?: string[];
};
