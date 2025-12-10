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

export const createAppConfig = (options: {
  runsInOffice: boolean;
}): ApplicationConfig => {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      {
        provide: WordService,
        useFactory: () =>
          options.runsInOffice ? new WordServiceImpl() : new NoOpWordService(),
      },
    ],
  };
};
