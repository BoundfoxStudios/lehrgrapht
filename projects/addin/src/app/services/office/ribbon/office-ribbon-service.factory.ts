import { inject } from '@angular/core';
import { RUN_CONFIGURATION } from '../../../models/run-configuration';
import { OfficeRibbonDesktopWebService } from './office-ribbon-desktop-web.service';
import { NoOpOfficeRibbonService } from './no-op-office-ribbon.service';
import { OfficeRibbonService } from './office-ribbon.service';

export const officeRibbonServiceFactory = (): OfficeRibbonService => {
  const runConfiguration = inject(RUN_CONFIGURATION);

  if (!runConfiguration.runsInOffice) {
    return new NoOpOfficeRibbonService();
  }

  return new OfficeRibbonDesktopWebService();
};
