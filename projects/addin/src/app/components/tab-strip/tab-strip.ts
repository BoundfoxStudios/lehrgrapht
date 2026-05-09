import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface TabStripItem {
  id: string;
  label: string;
  icon?: IconDefinition;
  count?: number;
  hasError?: boolean;
}

@Component({
  selector: 'lg-tab-strip',
  imports: [FaIconComponent],
  templateUrl: './tab-strip.html',
  styleUrl: './tab-strip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'border-default-medium flex w-full gap-0 overflow-x-auto bg-white border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    role: 'tablist',
  },
})
export class TabStrip {
  readonly tabs = input.required<TabStripItem[]>();
  readonly active = input.required<string>();
  readonly tabChange = output<string>();

  protected select(id: string): void {
    if (id !== this.active()) {
      this.tabChange.emit(id);
    }
  }
}
