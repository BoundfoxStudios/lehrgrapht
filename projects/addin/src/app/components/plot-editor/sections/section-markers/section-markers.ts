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
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Card } from '../../../../ui/card/card';
import { Input } from '../../../../ui/input/input';
import { SectionEmptyState } from '../section-empty-state/section-empty-state';
import { SectionMarkersImage } from './section-markers-image';
import { SectionHint } from '../../../section-hint/section-hint';

@Component({
  selector: 'lg-section-markers',
  imports: [
    FaIconComponent,
    ButtonDirective,
    Card,
    Input,
    SectionEmptyState,
    SectionMarkersImage,
    SectionHint,
  ],
  templateUrl: './section-markers.html',
  styleUrl: './section-markers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionMarkers {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly store = inject(PlotEditorStore);
  protected readonly newItemIndex = signal<number | null>(null);

  protected readonly expandedSet = computed(
    () => new Set(this.store.expandedItems().markers),
  );

  protected readonly allCollapsed = computed(
    () => this.store.expandedItems().markers.length === 0,
  );

  protected addManual(): void {
    this.store.addMarker();
    this.newItemIndex.set(this.store.model().markers.length - 1);
  }

  protected toggleAll(): void {
    if (this.allCollapsed()) {
      this.store.expandAllCards('markers');
    } else {
      this.store.collapseAllCards('markers');
    }
  }
}
