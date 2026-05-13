import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faCircleNotch,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { SolutionRenderService } from '../../services/solution-render.service';
import { SolutionViewService } from '../../services/solution-view.service';

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
  protected readonly faTriangleExclamation = faTriangleExclamation;

  protected readonly solutionViewService = inject(SolutionViewService);
  protected readonly solutionRenderService = inject(SolutionRenderService);

  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly backLink = input<unknown[]>();
  readonly showLogo = input(false, { transform: booleanAttribute });
  readonly saveState = input<HeaderSaveState>('idle');
  readonly loading = input(false);
}
