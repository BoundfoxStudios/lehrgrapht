import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

@Component({
  selector: 'lg-section-lines',
  imports: [FaIconComponent, FormField, Dropdown],
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
}
