import { Injectable } from '@angular/core';

const hasFirstRunExperienceKey = 'has-first-run-experience';
const hasSeenWordForWebNoticeKey = 'has-seen-word-for-web-notice';
const hasSeenCurrentChangelogKey = 'has-seen-current-changelog';

@Injectable({ providedIn: 'root' })
export class UserExperienceService {
  needsFirstRunExperience(): boolean {
    return !localStorage.getItem(hasFirstRunExperienceKey);
  }

  hadFirstRunExperience(): void {
    localStorage.setItem(hasFirstRunExperienceKey, 'true');
  }

  needsWordForWebNotice(): boolean {
    return !localStorage.getItem(hasSeenWordForWebNoticeKey);
  }

  hadWordForWebNotice(): void {
    localStorage.setItem(hasSeenWordForWebNoticeKey, 'true');
  }

  needsToSeeChangelog(version: string): boolean {
    return !localStorage.getItem(`${hasSeenCurrentChangelogKey}-${version}`);
  }

  hasSeenCurrentChangelog(version: string): void {
    localStorage.setItem(`${hasSeenCurrentChangelogKey}-${version}`, 'true');
  }
}
