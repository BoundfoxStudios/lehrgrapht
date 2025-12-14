import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  DOCUMENT,
} from '@angular/core';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { fromEvent, map, throttleTime } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-floating-scroll-to-top',
  imports: [FaIconComponent],
  templateUrl: './floating-scroll-to-top.component.html',
  styleUrl: './floating-scroll-to-top.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingScrollToTopComponent {
  protected readonly faAngleUp = faAngleUp;

  private readonly document = inject(DOCUMENT);

  private readonly scrollTop = toSignal(
    fromEvent(this.document, 'scroll').pipe(
      throttleTime(50),
      map(() => this.document.scrollingElement?.scrollTop ?? 0),
    ),
    {
      initialValue: 0,
    },
  );

  protected readonly show = computed(() => this.scrollTop() > 150);

  protected scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
