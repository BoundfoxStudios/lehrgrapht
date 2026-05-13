import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export type SwitchSize = 'small' | 'medium';

@Component({
  selector: 'lg-switch',
  imports: [],
  templateUrl: './switch.html',
  styleUrl: './switch.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch implements FormValueControl<boolean> {
  readonly value = model<boolean>(false);
  readonly disabled = input(false);
  readonly size = input<SwitchSize>('medium');
  readonly inputId = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.value.update(v => !v);
  }
}
