import {
  mergeApplicationConfig,
  ApplicationConfig,
  provideAppInitializer,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { githubServiceAppInitializer } from './services/github.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideAppInitializer(githubServiceAppInitializer),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
