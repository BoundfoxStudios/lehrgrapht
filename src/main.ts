import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/components/app/app';
import { runsInOffice } from './app/services/office.service';

const bootstrap = (): void => {
  bootstrapApplication(App, appConfig).catch((err: unknown) => {
    console.error(err);
  });
};

if (runsInOffice) {
  Office.initialize = (): void => {
    bootstrap();
  };
} else {
  bootstrap();
}
