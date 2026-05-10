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
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { labelPositionOptions } from '../../dropdown-options';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Card } from '../../../../ui/card/card';
import { Input } from '../../../../ui/input/input';
import { SectionEmptyState } from '../section-empty-state/section-empty-state';
import { SectionAreasImage } from './section-areas-image';

@Component({
  selector: 'lg-section-areas',
  imports: [
    FaIconComponent,
    FormField,
    Dropdown,
    ButtonDirective,
    Card,
    Input,
    SectionEmptyState,
    SectionAreasImage,
  ],
  templateUrl: './section-areas.html',
  styleUrl: './section-areas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionAreas {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly labelPositionOptions = labelPositionOptions;
  protected readonly store = inject(PlotEditorStore);
  protected readonly newItemIndex = signal<number | null>(null);

  protected readonly expandedSet = computed(
    () => new Set(this.store.expandedItems().areas),
  );

  protected readonly allCollapsed = computed(
    () => this.store.expandedItems().areas.length === 0,
  );

  protected addManual(): void {
    this.store.addArea();
    this.newItemIndex.set(this.store.model().areas.length - 1);
  }

  protected toggleAll(): void {
    if (this.allCollapsed()) {
      this.store.expandAllCards('areas');
    } else {
      this.store.collapseAllCards('areas');
    }
  }
}
