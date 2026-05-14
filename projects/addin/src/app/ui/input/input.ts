import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Field, FormField } from '@angular/forms/signals';
import { AutofocusDirective } from '../../directives/autofocus.directive';

export type InputType = 'text' | 'number';

@Component({
  selector: 'lg-input',
  imports: [FormField, AutofocusDirective],
  templateUrl: './input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class Input {
  readonly field = input.required<Field<string | number>>();
  readonly id = input.required<string>();
  readonly type = input<InputType>('text');
  readonly step = input<number | string | undefined>(undefined);
  readonly placeholder = input<string>('');
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly autocomplete = input<string>('on');
  readonly autocorrect = input<'on' | 'off'>('on');
  readonly autocapitalize = input<
    'on' | 'off' | 'none' | 'sentences' | 'words' | 'characters'
  >('on');
  readonly spellcheck = input(true, { transform: booleanAttribute });

  protected readonly errors = computed(() => this.field()().errors());
}
