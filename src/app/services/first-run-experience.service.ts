import { Injectable } from '@angular/core';

const key = 'has-first-run-experience';

@Injectable({ providedIn: 'root' })
export class FirstRunExperienceService {
  needsFirstRunExperience(): boolean {
    return !localStorage.getItem(key);
  }

  hadFirstRunExperience(): void {
    localStorage.setItem(key, 'true');
  }
}
