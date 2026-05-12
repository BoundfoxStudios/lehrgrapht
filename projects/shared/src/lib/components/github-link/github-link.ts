import { Component, computed, input } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { IconLink } from '../icon-link/icon-link';

export const gitHubUrl = 'https://github.com/boundfoxstudios/lehrgrapht';

@Component({
  selector: 'lgs-github-link',
  imports: [IconLink],
  templateUrl: './github-link.html',
  styleUrl: './github-link.css',
})
export class GitHubLink {
  protected readonly faGithub = faGithub;

  readonly deepLink = input<string | undefined>(undefined);
  readonly text = input<string>('GitHub');
  readonly underline = input(true);

  protected readonly url = computed(() => {
    const deepLink = this.deepLink();

    if (!deepLink) {
      return gitHubUrl;
    }

    return `${gitHubUrl}/${deepLink}`;
  });
}
