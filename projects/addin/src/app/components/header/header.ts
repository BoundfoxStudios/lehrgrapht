import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';

export type HeaderSaveState = 'idle' | 'saving' | 'saved';

@Component({
  selector: 'lg-header',
  imports: [RouterLink, FaIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faCheck = faCheck;
  protected readonly faCircleNotch = faCircleNotch;

  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly backLink = input<unknown[]>();
  readonly saveState = input<HeaderSaveState>('idle');
}
