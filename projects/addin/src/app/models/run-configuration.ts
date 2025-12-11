import { InjectionToken } from '@angular/core';

export const RUN_CONFIGURATION = new InjectionToken<RunConfiguration>(
  'run configuration',
);

export interface RunConfiguration {
  runsInOffice: boolean;
  runsOnline: boolean;
}
