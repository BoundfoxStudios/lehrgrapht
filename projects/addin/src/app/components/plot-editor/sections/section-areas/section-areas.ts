import {
  ChangeDetectionStrategy,
  Component,
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
import { Plot } from '../../../../models/plot';
import { Dropdown } from '../../../dropdown/dropdown';
import { InteractiveMode } from '../../interactive-mode';
import { labelPositionOptions } from '../../dropdown-options';

export interface RemoveAreaPointEvent {
  areaIndex: number;
  pointIndex: number;
}

@Component({
  selector: 'lg-section-areas',
  imports: [FaIconComponent, FormField, Dropdown],
  templateUrl: './section-areas.html',
  styleUrl: './section-areas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionAreas {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly faCheck = faCheck;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly labelPositionOptions = labelPositionOptions;

  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly interactiveMode = input.required<InteractiveMode>();
  readonly interactivePoints = input.required<{ x: number; y: number }[]>();

  readonly addArea = output();
  readonly removeArea = output<number>();
  readonly addAreaPoint = output<number>();
  readonly removeAreaPoint = output<RemoveAreaPointEvent>();
  readonly startInteractive = output();
  readonly cancelInteractive = output();
  readonly finishInteractive = output();
  readonly removeInteractivePoint = output<number>();
}
