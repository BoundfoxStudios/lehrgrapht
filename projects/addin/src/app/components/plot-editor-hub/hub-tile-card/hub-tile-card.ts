import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'lg-hub-tile-card',
  imports: [FaIconComponent, RouterLink],
  templateUrl: './hub-tile-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HubTileCard {
  readonly icon = input.required<IconDefinition>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly count = input<number>(0);
  readonly routerLink = input.required<unknown[]>();
}
