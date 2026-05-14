import {
  afterNextRender,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[lgAutofocus]',
})
export class AutofocusDirective {
  private readonly el =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

  readonly enabled = input(true, { alias: 'lgAutofocus' });

  constructor() {
    afterNextRender({
      write: () => {
        if (this.enabled()) {
          this.el.nativeElement.focus();
          this.el.nativeElement.select();
        }
      },
    });
  }
}
