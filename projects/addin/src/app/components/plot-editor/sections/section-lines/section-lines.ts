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
import { lineStyleOptions } from '../../dropdown-options';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Card } from '../../../../ui/card/card';
import { Input } from '../../../../ui/input/input';
import { SectionEmptyState } from '../section-empty-state/section-empty-state';
import { SectionLinesImage } from './section-lines-image';

@Component({
  selector: 'lg-section-lines',
  imports: [
    FaIconComponent,
    FormField,
    Dropdown,
    ButtonDirective,
    Card,
    Input,
    SectionEmptyState,
    SectionLinesImage,
  ],
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

  protected readonly expandedSet = computed(
    () => new Set(this.store.expandedItems().lines),
  );

  protected readonly allCollapsed = computed(
    () => this.store.expandedItems().lines.length === 0,
  );

  protected addManual(): void {
    this.store.addLine();
    this.newItemIndex.set(this.store.model().lines.length - 1);
  }

  protected toggleAll(): void {
    if (this.allCollapsed()) {
      this.store.expandAllCards('lines');
    } else {
      this.store.collapseAllCards('lines');
    }
  }
}
