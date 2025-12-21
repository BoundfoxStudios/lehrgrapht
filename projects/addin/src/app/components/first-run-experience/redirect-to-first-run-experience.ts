import { MaybeAsync, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { UserExperienceService } from '../../services/user-experience.service';

export const redirectToFirstRunExperience = (): MaybeAsync<UrlTree> => {
  const userExperienceService = inject(UserExperienceService);
  const router = inject(Router);

  if (userExperienceService.needsFirstRunExperience()) {
    return router.createUrlTree(['/first-run-experience']);
  }

  return router.createUrlTree(['/plot']);
};
