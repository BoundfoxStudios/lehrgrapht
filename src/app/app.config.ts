import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  NoOpWordService,
  WordService,
  WordServiceImpl,
} from './services/word.service';
import {
  RUN_CONFIGURATION,
  RunConfiguration,
} from './models/run-configuration';

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
        useFactory: () =>
          runConfiguration.runsInOffice
            ? new WordServiceImpl()
            : new NoOpWordService(),
      },
    ],
  };
};
