import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { NoOpWordService, WordService } from './services/word.service';
import { runsInOffice } from './services/office.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: WordService,
      useFactory: () =>
        runsInOffice ? new WordService() : new NoOpWordService(),
    },
  ],
};
