import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'lg-hub-link-card',
  imports: [FaIconComponent, RouterLink],
  templateUrl: './hub-link-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HubLinkCard {
  readonly icon = input.required<IconDefinition>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly routerLink = input.required<unknown[]>();
  readonly tabularNums = input(false, { transform: booleanAttribute });

  protected readonly faChevronRight = faChevronRight;
}
