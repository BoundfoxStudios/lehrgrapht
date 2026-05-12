import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export interface PillSwitchOption<T> {
  value: T;
  label: string;
}

export type PillSwitchShape = 'square' | 'pill';

@Component({
  selector: 'lg-pill-switch',
  imports: [],
  templateUrl: './pill-switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup',
    class: 'flex gap-1',
  },
})
export class PillSwitch<T> implements FormValueControl<T> {
  readonly options = input.required<PillSwitchOption<T>[]>();
  readonly value = model<T>(undefined as unknown as T);
  readonly disabled = input(false);
  readonly shape = input<PillSwitchShape>('square');
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  protected select(option: PillSwitchOption<T>): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(option.value);
  }
}
