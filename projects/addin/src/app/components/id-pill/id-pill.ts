import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type IdPillPrefix = 'P' | 'L' | 'f' | 'A';
export type IdPillState = 'normal' | 'new';

@Component({
  selector: 'lg-id-pill',
  imports: [],
  templateUrl: './id-pill.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'grid h-[22px] w-[22px] shrink-0 place-items-center text-[9px] font-bold text-white',
    '[class.rounded-full]': 'isCircle()',
    '[class.rounded-md]': '!isCircle()',
    '[style.background]': 'color()',
    role: 'img',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class IdPill {
  readonly prefix = input.required<IdPillPrefix>();
  readonly index = input.required<number>();
  readonly color = input<string>('#3737d0');
  readonly state = input<IdPillState>('normal');

  protected readonly label = computed(
    () => `${this.prefix()}${this.index() + 1}`,
  );
  protected readonly ariaLabel = computed(() => this.label());
  protected readonly isCircle = computed(() => {
    const p = this.prefix();
    return p === 'P' || p === 'f';
  });
}
