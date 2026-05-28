import { bootstrapApplication } from '@angular/platform-browser';

import { SteamIdlerLogger } from '@steam-idler/infra';

import { App } from './app/app';
import { appConfig } from './app/app.config';

const logger = new SteamIdlerLogger();

bootstrapApplication(App, appConfig).catch((err) => {
  logger.error('Bootstrap', 'Failed to bootstrap application', err);
});
