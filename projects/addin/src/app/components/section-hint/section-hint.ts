import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleInfo,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lg-section-hint',
  imports: [FaIconComponent],
  templateUrl: './section-hint.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'bg-brand-soft text-brand-strong flex items-center gap-1.5 rounded-base px-2.5 py-2 text-2xs',
    role: 'note',
  },
})
export class SectionHint {
  readonly icon = input<IconDefinition>(faCircleInfo);
}
