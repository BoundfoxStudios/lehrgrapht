import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';

@Component({
  selector: 'lg-checkbox',
  imports: [FormField],
  templateUrl: './checkbox.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class Checkbox {
  readonly field = input.required<Field<boolean>>();
  readonly id = input.required<string>();
}
