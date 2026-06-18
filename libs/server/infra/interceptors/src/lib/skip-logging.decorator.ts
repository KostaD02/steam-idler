import { SetMetadata } from '@nestjs/common';

// TODO: Move this to dedicated infra/decorator lib

export const SKIP_LOGGING = Symbol('SKIP_LOGGING');
export const SkipLogging = () => SetMetadata(SKIP_LOGGING, true);
