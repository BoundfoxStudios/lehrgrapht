import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faMousePointer,
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { InteractiveMode } from '../../interactive-mode';
import { PlotEditorStore } from '../../plot-editor.store';

@Component({
  selector: 'lg-section-empty-state',
  imports: [FaIconComponent, ButtonDirective],
  templateUrl: './section-empty-state.html',
  styleUrl: './section-empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-3',
  },
})
export class SectionEmptyState {
  protected readonly faMousePointer = faMousePointer;
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly store = inject(PlotEditorStore);

  readonly heading = input.required<string>();
  readonly text = input.required<string>();
  readonly interactiveMode =
    input.required<Exclude<InteractiveMode, InteractiveMode.Off>>();

  readonly manualClick = output();

  protected startInteractive(): void {
    this.store.startInteractive(this.interactiveMode());
  }
}
