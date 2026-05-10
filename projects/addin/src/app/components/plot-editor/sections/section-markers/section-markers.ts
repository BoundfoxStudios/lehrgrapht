import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { MarkerNamingService } from '../../../../services/marker-naming.service';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Input } from '../../../../ui/input/input';
import { SectionEmptyState } from '../section-empty-state/section-empty-state';
import { SectionMarkersImage } from './section-markers-image';

@Component({
  selector: 'lg-section-markers',
  imports: [
    FaIconComponent,
    ButtonDirective,
    Input,
    SectionEmptyState,
    SectionMarkersImage,
  ],
  templateUrl: './section-markers.html',
  styleUrl: './section-markers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionMarkers {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly faCheck = faCheck;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly markerNamingService = inject(MarkerNamingService);
  protected readonly store = inject(PlotEditorStore);
  protected readonly newItemIndex = signal<number | null>(null);

  protected addManual(): void {
    this.store.addMarker();
    this.newItemIndex.set(this.store.model().markers.length - 1);
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
