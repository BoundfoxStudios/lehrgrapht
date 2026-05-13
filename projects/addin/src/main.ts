import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/components/app/app';
import { createAppConfig } from './app/app.config';
import { RunConfiguration } from './app/models/run-configuration';
import { SolutionRenderService } from './app/services/solution-render.service';
import { SolutionRibbonService } from './app/services/solution-ribbon.service';
import { SolutionViewService } from './app/services/solution-view.service';

const bootstrap = (runConfiguration: RunConfiguration): void => {
  bootstrapApplication(App, createAppConfig(runConfiguration))
    .then(appRef => {
      const solutionView = appRef.injector.get(SolutionViewService);
      appRef.injector.get(SolutionRenderService);
      appRef.injector.get(SolutionRibbonService);
      Office.actions.associate(
        'showSolution',
        (event: Office.AddinCommands.Event) => {
          solutionView.show();
          event.completed();
        },
      );
      Office.actions.associate(
        'hideSolution',
        (event: Office.AddinCommands.Event) => {
          solutionView.hide();
          event.completed();
        },
      );
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
