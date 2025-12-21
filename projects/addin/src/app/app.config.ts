import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { WordService } from './services/word/word.service';
import {
  RUN_CONFIGURATION,
  RunConfiguration,
} from './models/run-configuration';
import { wordServiceFactory } from './services/word/word-service.factory';

export const createAppConfig = (
  runConfiguration: RunConfiguration,
): ApplicationConfig => {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      { provide: RUN_CONFIGURATION, useValue: runConfiguration },
      {
        provide: WordService,
        useFactory: () => wordServiceFactory(runConfiguration),
      },
    ],
  };
};
