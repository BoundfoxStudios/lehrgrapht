import { Component, input } from '@angular/core';

@Component({
  selector: 'lg-section',
  imports: [],
  templateUrl: './section.html',
  styleUrl: './section.css',
})
export class Section {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
