import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

let toggleRowIdCounter = 0;

@Component({
  selector: 'lg-toggle-row',
  imports: [],
  templateUrl: './toggle-row.html',
  styleUrl: './toggle-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center gap-2 py-1.5',
  },
})
export class ToggleRow implements FormValueControl<boolean> {
  readonly label = input.required<string>();
  readonly sub = input<string>('');
  readonly value = model<boolean>(false);
  readonly disabled = input(false);

  protected readonly inputId = `lg-toggle-row-${++toggleRowIdCounter}`;

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.value.update(v => !v);
  }
}
