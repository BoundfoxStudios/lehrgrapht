import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FormField } from '@angular/forms/signals';
import { AutofocusDirective } from '../../../../directives/autofocus.directive';
import { Dropdown } from '../../../dropdown/dropdown';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { lineStyleOptions } from '../../dropdown-options';

@Component({
  selector: 'lg-section-lines',
  imports: [FaIconComponent, FormField, Dropdown, AutofocusDirective],
  templateUrl: './section-lines.html',
  styleUrl: './section-lines.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionLines {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly lineStyleOptions = lineStyleOptions;
  protected readonly store = inject(PlotEditorStore);
  protected readonly newItemIndex = signal<number | null>(null);

  protected addManual(): void {
    this.store.addLine();
    this.newItemIndex.set(this.store.model().lines.length - 1);
  }

  protected onCardFocusout(event: FocusEvent): void {
    const card = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as HTMLElement | null;
    if (next && card.contains(next)) {
      return;
    }
    this.newItemIndex.set(null);
  }
}
