import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FormField } from '@angular/forms/signals';
import { MarkerNamingService } from '../../../../services/marker-naming.service';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';

@Component({
  selector: 'lg-section-markers',
  imports: [FaIconComponent, FormField],
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
}
