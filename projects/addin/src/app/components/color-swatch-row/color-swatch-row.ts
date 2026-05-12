import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';

export interface ColorSwatchOption {
  value: string;
  color: string;
  label?: string;
}

@Component({
  selector: 'lg-color-swatch-row',
  imports: [],
  templateUrl: './color-swatch-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'radiogroup',
    class: 'flex gap-1.5',
  },
})
export class ColorSwatchRow implements FormValueControl<string> {
  readonly options = input.required<ColorSwatchOption[]>();
  readonly value = model<string>('');
  readonly disabled = input(false);

  protected select(option: ColorSwatchOption): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(option.value);
  }
}
