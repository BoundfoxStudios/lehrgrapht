import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/components/app/app';
import { createAppConfig } from './app/app.config';
import { RunConfiguration } from './app/models/run-configuration';
import { OfficeRibbonService } from './app/services/office/ribbon/office-ribbon.service';
import { SolutionRenderService } from './app/services/solution-render.service';

const bootstrap = (runConfiguration: RunConfiguration): void => {
  bootstrapApplication(App, createAppConfig(runConfiguration))
    .then(appRef => {
      // We're injecting here to get the effects going of those services.
      appRef.injector.get(OfficeRibbonService);
      appRef.injector.get(SolutionRenderService);
    })
    .catch((err: unknown) => {
      console.error(err);
    });
};

void Office.onReady(info => {
  bootstrap({
    runsInOffice: info.host === Office.HostType.Word,
    runsOnline: info.platform === Office.PlatformType.OfficeOnline,
  });
});
