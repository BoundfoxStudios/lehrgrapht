import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/components/app/app';
import { createAppConfig } from './app/app.config';

const bootstrap = (options: { runsInOffice: boolean }): void => {
  bootstrapApplication(App, createAppConfig(options)).catch((err: unknown) => {
    console.error(err);
  });
};

void Office.onReady(info => {
  bootstrap({
    runsInOffice: info.host === Office.HostType.Word,
  });
});
