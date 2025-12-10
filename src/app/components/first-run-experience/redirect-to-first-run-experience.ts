import { MaybeAsync, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { FirstRunExperienceService } from '../../services/first-run-experience.service';

export const redirectToFirstRunExperience = (): MaybeAsync<UrlTree> => {
  const firstRunExperienceService = inject(FirstRunExperienceService);
  const router = inject(Router);

  if (firstRunExperienceService.needsFirstRunExperience()) {
    return router.createUrlTree(['/first-run-experience']);
  }

  return router.createUrlTree(['/plot']);
};
