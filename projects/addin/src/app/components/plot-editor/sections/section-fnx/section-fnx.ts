import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { PillSwitch } from '../../../pill-switch/pill-switch';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import {
  legendPositionOptions,
  lineStyleOptions,
} from '../../dropdown-options';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Card } from '../../../../ui/card/card';
import { Input } from '../../../../ui/input/input';
import { SectionEmptyState } from '../section-empty-state/section-empty-state';
import { SectionFnxImage } from './section-fnx-image';
import { IdPill } from '../../../id-pill/id-pill';

@Component({
  selector: 'lg-section-fnx',
  imports: [
    FaIconComponent,
    FormField,
    Dropdown,
    PillSwitch,
    MathDisplay,
    ButtonDirective,
    Card,
    Input,
    SectionEmptyState,
    SectionFnxImage,
    IdPill,
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

  protected readonly expandedSet = computed(
    () => new Set(this.store.expandedItems().fnx),
  );

  protected readonly allCollapsed = computed(
    () => this.store.expandedItems().fnx.length === 0,
  );

  protected addManual(): void {
    this.store.addFx();
    this.newItemIndex.set(this.store.model().fnx.length - 1);
  }

  protected toggleAll(): void {
    if (this.allCollapsed()) {
      this.store.expandAllCards('fnx');
    } else {
      this.store.collapseAllCards('fnx');
    }
  }
}
