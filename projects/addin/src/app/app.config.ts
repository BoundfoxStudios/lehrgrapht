import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { WordPlotService } from './services/office/plot/word-plot.service';
import {
  RUN_CONFIGURATION,
  RunConfiguration,
} from './models/run-configuration';
import { wordPlotServiceFactory } from './services/office/plot/word-plot-service.factory';
import { OfficeRibbonService } from './services/office/ribbon/office-ribbon.service';
import { officeRibbonServiceFactory } from './services/office/ribbon/office-ribbon-service.factory';

export const createAppConfig = (
  runConfiguration: RunConfiguration,
): ApplicationConfig => {
  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter(routes),
      { provide: RUN_CONFIGURATION, useValue: runConfiguration },
      {
        provide: WordPlotService,
        useFactory: wordPlotServiceFactory,
      },
      {
        provide: OfficeRibbonService,
        useFactory: officeRibbonServiceFactory,
      },
    ],
  };
};
