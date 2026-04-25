import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvVariables } from '@steam-idler/server/infra/types';

// Wrapper for ConfigService that provides typed access to environment variables
@Injectable()
export class EnvironmentService extends ConfigService<EnvVariables> {}
