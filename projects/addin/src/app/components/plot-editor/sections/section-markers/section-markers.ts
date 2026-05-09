import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Plot, PlotSettings } from '../../../../models/plot';
import { MarkerNamingService } from '../../../../services/marker-naming.service';
import { InteractiveMode } from '../../interactive-mode';

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

  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly editorModel = input.required<Plot>();
  readonly plotSettings = input.required<PlotSettings>();
  readonly interactiveMode = input.required<InteractiveMode>();
  readonly interactivePoints = input.required<{ x: number; y: number }[]>();

  readonly addMarker = output();
  readonly removeMarker = output<number>();
  readonly startInteractive = output();
  readonly cancelInteractive = output();
  readonly finishInteractive = output();
  readonly removeInteractivePoint = output<number>();
}
