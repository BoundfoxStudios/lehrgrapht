import { RedirectCommand, Router } from '@angular/router';
import { inject } from '@angular/core';
import { RUN_CONFIGURATION } from '../../models/run-configuration';
import { UserExperienceService } from '../../services/user-experience.service';

export const wordForWebNoticeGuard = (): true | RedirectCommand => {
  const userExperienceService = inject(UserExperienceService);
  const runConfiguration = inject(RUN_CONFIGURATION);
  const router = inject(Router);

  const needsWordForWebNotice = userExperienceService.needsWordForWebNotice();

  if (runConfiguration.runsOnline && needsWordForWebNotice) {
    return new RedirectCommand(router.createUrlTree(['/word-for-web-notice']));
  }

  return true;
};
