import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/components/app/app';
import { createAppConfig } from './app/app.config';
import { RunConfiguration } from './app/models/run-configuration';
import { SolutionViewService } from './app/services/solution-view.service';

const bootstrap = (runConfiguration: RunConfiguration): void => {
  bootstrapApplication(App, createAppConfig(runConfiguration))
    .then(appRef => {
      const solutionView = appRef.injector.get(SolutionViewService);
      Office.actions.associate('toggleSolutionView', () => {
        void solutionView.toggle();
      });
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
