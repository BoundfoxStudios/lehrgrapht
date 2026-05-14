import { RUN_CONFIGURATION } from '../../../models/run-configuration';
import { NoOpWordPlotService } from './no-op-word-plot.service';
import { WordPlotForWebService } from './word-plot-for-web.service';
import { WordPlotForDesktopService } from './word-plot-for-desktop.service';
import { WordPlotService } from './word-plot.service';
import { inject } from '@angular/core';

export const wordPlotServiceFactory = (): WordPlotService => {
  const runConfiguration = inject(RUN_CONFIGURATION);

  if (!runConfiguration.runsInOffice) {
    return new NoOpWordPlotService();
  }

  if (runConfiguration.runsOnline) {
    return new WordPlotForWebService();
  }

  return new WordPlotForDesktopService();
};
