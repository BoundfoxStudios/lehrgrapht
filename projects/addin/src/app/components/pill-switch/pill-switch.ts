import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export interface PillSwitchOption<T> {
  value: T;
  label: string;
}

export type PillSwitchOptions<T> =
  | PillSwitchOption<T>[]
  | PillSwitchOption<T>[][];

export type PillSwitchShape = 'square' | 'pill';

@Component({
  selector: 'lg-pill-switch',
  imports: [],
  templateUrl: './pill-switch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup',
    class: 'flex flex-col gap-1',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
})
export class PillSwitch<T> implements FormValueControl<T> {
  readonly options = input.required<PillSwitchOptions<T>>();
  readonly value = model<T>(undefined as unknown as T);
  readonly disabled = input(false);
  readonly shape = input<PillSwitchShape>('square');
  readonly ariaLabel = input<string>('', { alias: 'aria-label' });

  protected readonly groups = computed<PillSwitchOption<T>[][]>(() => {
    const opts = this.options();
    if (opts.length === 0) {
      return [];
    }
    return Array.isArray(opts[0])
      ? (opts as PillSwitchOption<T>[][])
      : [opts as PillSwitchOption<T>[]];
  });

  protected select(option: PillSwitchOption<T>): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(option.value);
  }
}
