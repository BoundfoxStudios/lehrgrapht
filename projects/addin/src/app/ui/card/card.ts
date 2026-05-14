import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

let cardIdCounter = 0;

@Component({
  selector: 'lg-card',
  imports: [FaIconComponent],
  templateUrl: './card.html',
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusout)': 'onFocusout($event)',
  },
})
export class Card {
  readonly title = input.required<string>();
  readonly expanded = input(false, { transform: booleanAttribute });
  readonly isNew = input(false, { transform: booleanAttribute });

  readonly expandedChange = output();
  readonly cardFocusOut = output<FocusEvent>();

  protected readonly faChevronDown = faChevronDown;
  protected readonly faChevronRight = faChevronRight;
  protected readonly bodyId = `lg-card-body-${++cardIdCounter}`;

  protected toggle(): void {
    this.expandedChange.emit();
  }

  protected onFocusout(event: FocusEvent): void {
    const card = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as HTMLElement | null;
    if (next && card.contains(next)) {
      return;
    }
    this.cardFocusOut.emit(event);
  }
}
