import { RedirectCommand, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RUN_CONFIGURATION } from '../../models/run-configuration';

export const cannotRunOnlineGuard = (): true | RedirectCommand => {
  const runConfiguration = inject(RUN_CONFIGURATION);
  const router = inject(Router);

  if (runConfiguration.runsOnline) {
    return new RedirectCommand(router.createUrlTree(['/cannot-run-online']));
  }

  return true;
};
