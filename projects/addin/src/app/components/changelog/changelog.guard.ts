import { RedirectCommand, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserExperienceService } from '../../services/user-experience.service';
import { lehrgraphtVersion } from '../../../version';

export const changelogGuard = (): true | RedirectCommand => {
  const userExperienceService = inject(UserExperienceService);
  const router = inject(Router);

  if (userExperienceService.needsToSeeChangelog(lehrgraphtVersion)) {
    return new RedirectCommand(
      router.createUrlTree(['/changelog'], {
        queryParams: { showUpdateNotice: true },
      }),
    );
  }

  return true;
};
