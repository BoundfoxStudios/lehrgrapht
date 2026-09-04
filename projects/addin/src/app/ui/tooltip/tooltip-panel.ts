import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'lg-tooltip-panel',
  imports: [NgTemplateOutlet],
  templateUrl: './tooltip-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // The transparent padding keeps the gap to the trigger inside the overlay,
    // so the pointer never crosses a dead zone (WCAG 1.4.13 "hoverable").
    class: 'block py-2',
  },
})
export class TooltipPanel {
  readonly content = input.required<string | TemplateRef<void>>();
  readonly panelId = input.required<string>();

  protected readonly contentTemplate = computed(() => {
    const content = this.content();
    return content instanceof TemplateRef ? content : null;
  });

  protected readonly contentText = computed(() => {
    const content = this.content();
    return typeof content === 'string' ? content : '';
  });
}
