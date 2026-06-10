import { booleanAttribute, computed, Directive, input } from '@angular/core';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'ghost-light'
  | 'ghost-danger'
  | 'danger';
export type ButtonSize = 'default' | 'small' | 'cta';

const BASE_CLASSES =
  'box-border inline-flex cursor-pointer items-center justify-center gap-1.5 border border-transparent text-center leading-5 transition-all duration-200 ease-in-out focus:ring-4 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'rounded-base bg-brand hover:bg-brand-strong focus:ring-brand-medium text-white shadow-sm disabled:hover:bg-brand',
  secondary:
    'rounded-base border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-200 shadow-sm',
  outline:
    'rounded-base border-default-medium text-body hover:border-brand hover:text-brand bg-white',
  ghost:
    'rounded-full h-8 w-8 bg-white/15 text-white hover:bg-white/25 focus:ring-white/30 disabled:hover:bg-white/15',
  'ghost-light':
    'rounded-base text-body-subtle hover:bg-neutral-secondary hover:text-body focus:ring-gray-200',
  'ghost-danger':
    'rounded-base text-body-subtle hover:bg-rose-50 hover:text-rose-600 focus:ring-rose-200',
  danger:
    'rounded-base bg-rose-600 hover:bg-rose-700 focus:ring-rose-200 text-white shadow-sm disabled:hover:bg-rose-600',
};

@Directive({
  selector: 'button[lgButton], a[lgButton]',
  host: {
    '[class]': 'classes()',
  },
})
export class ButtonDirective {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('default');
  readonly iconOnly = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() => {
    const size = this.size();
    const variant = this.variant();

    const padding = this.iconOnly()
      ? size === 'small'
        ? 'p-2'
        : 'p-2.5'
      : size === 'small'
        ? 'px-2.5 py-1.5'
        : size === 'cta'
          ? 'px-2.5 py-2.5'
          : 'px-4 py-2.5';

    const text = size === 'default' ? 'text-sm' : 'text-xs';

    const fontWeight =
      size === 'cta' && variant === 'primary' ? 'font-semibold' : 'font-medium';

    return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${padding} ${text} ${fontWeight}`;
  });
}
