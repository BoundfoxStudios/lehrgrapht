import { Component, input } from '@angular/core';
import {
  FaIconComponent,
  IconDefinition,
} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'lgs-icon-link',
  imports: [FaIconComponent],
  templateUrl: './icon-link.html',
  styleUrl: './icon-link.css',
})
export class IconLink {
  readonly url = input.required<string>();
  readonly icon = input.required<IconDefinition>();
  readonly text = input.required<string>();
}
