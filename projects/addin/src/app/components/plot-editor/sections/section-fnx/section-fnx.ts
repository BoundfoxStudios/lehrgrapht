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
import { Dropdown } from '../../../dropdown/dropdown';
import { MathDisplay } from '../../../math-display/math-display';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import {
  legendPositionOptions,
  lineStyleOptions,
} from '../../dropdown-options';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Input } from '../../../../ui/input/input';

@Component({
  selector: 'lg-section-fnx',
  imports: [
    FaIconComponent,
    FormField,
    Dropdown,
    MathDisplay,
    ButtonDirective,
    Input,
  ],
  templateUrl: './section-fnx.html',
  styleUrl: './section-fnx.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionFnx {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly lineStyleOptions = lineStyleOptions;
  protected readonly legendPositionOptions = legendPositionOptions;

  protected readonly store = inject(PlotEditorStore);
  protected readonly newItemIndex = signal<number | null>(null);

  protected addManual(): void {
    this.store.addFx();
    this.newItemIndex.set(this.store.model().fnx.length - 1);
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
