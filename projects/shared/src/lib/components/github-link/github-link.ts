import { Component, computed, input } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { IconLink } from '../icon-link/icon-link';

const baseGitHubUrl = 'https://github.com/boundfoxstudios/lehrgrapht';

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

  protected readonly url = computed(() => {
    const deepLink = this.deepLink();

    if (!deepLink) {
      return baseGitHubUrl;
    }

    return `${baseGitHubUrl}/${deepLink}`;
  });
}
