import { Component, computed, input } from '@angular/core';
import { IconLink } from '../icon-link/icon-link';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lgs-support-email-link',
  imports: [IconLink],
  templateUrl: './support-email-link.html',
  styleUrl: './support-email-link.css',
})
export class SupportEmailLink {
  protected readonly faEnvelope = faEnvelope;

  readonly subject = input<string | undefined>(undefined);

  protected readonly url = computed(() => {
    const baseUrl = 'mailto:support@lehrgrapht.de';
    const subject = this.subject();

    if (!subject) {
      return baseUrl;
    }

    return `${baseUrl}?subject=${subject}`;
  });
}
