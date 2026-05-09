import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMousePointer,
  faPlusCircle,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Plot } from '../../../../models/plot';
import { Dropdown } from '../../../dropdown/dropdown';
import { InteractiveMode } from '../../interactive-mode';
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

  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly interactiveMode = input.required<InteractiveMode>();
  readonly interactivePoints = input.required<{ x: number; y: number }[]>();

  readonly addLine = output();
  readonly removeLine = output<number>();
  readonly startInteractive = output();
  readonly cancelInteractive = output();
  readonly removeInteractivePoint = output<number>();
}
