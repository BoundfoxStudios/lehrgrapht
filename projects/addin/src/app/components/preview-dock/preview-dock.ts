import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleExclamation,
  faPlus,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';
import { PlotEditorStore } from '../plot-editor/plot-editor.store';
import { PlotPreview } from '../plot-preview/plot-preview';
import { ButtonDirective } from '../../ui/button/button.directive';

@Component({
  selector: 'lg-preview-dock',
  imports: [FaIconComponent, PlotPreview, ButtonDirective],
  templateUrl: './preview-dock.html',
  styleUrl: './preview-dock.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'border-default-medium sticky bottom-0 block border-t bg-white',
  },
})
export class PreviewDock {
  protected readonly faPlus = faPlus;
  protected readonly faRotate = faRotate;
  protected readonly faCircleExclamation = faCircleExclamation;

  protected readonly store = inject(PlotEditorStore);
  readonly errorVariant = input(false);
}
