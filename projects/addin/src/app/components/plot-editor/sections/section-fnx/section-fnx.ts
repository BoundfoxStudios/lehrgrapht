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
import { MathDisplay } from '../../../math-display/math-display';
import { InteractiveMode } from '../../interactive-mode';
import {
  legendPositionOptions,
  lineStyleOptions,
} from '../../dropdown-options';

@Component({
  selector: 'lg-section-fnx',
  imports: [FaIconComponent, FormField, Dropdown, MathDisplay],
  templateUrl: './section-fnx.html',
  styleUrl: './section-fnx.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionFnx {
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faTrashCan = faTrashCan;
  protected readonly faMousePointer = faMousePointer;
  protected readonly InteractiveMode = InteractiveMode;
  protected readonly lineStyleOptions = lineStyleOptions;
  protected readonly legendPositionOptions = legendPositionOptions;

  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly editorModel = input.required<Plot>();
  readonly interactiveMode = input.required<InteractiveMode>();
  readonly interactivePoints = input.required<{ x: number; y: number }[]>();

  readonly addFx = output();
  readonly removeFx = output<number>();
  readonly startInteractive = output();
  readonly cancelInteractive = output();
  readonly removeInteractivePoint = output<number>();
}
