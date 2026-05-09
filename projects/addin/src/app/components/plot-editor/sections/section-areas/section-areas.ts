import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCheck,
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FormField } from '@angular/forms/signals';
import { Dropdown } from '../../../dropdown/dropdown';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';
import { labelPositionOptions } from '../../dropdown-options';

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
  protected readonly store = inject(PlotEditorStore);
}
