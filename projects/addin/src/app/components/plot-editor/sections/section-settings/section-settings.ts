import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Dropdown } from '../../../dropdown/dropdown';
import { PlotEditorStore } from '../../plot-editor.store';
import { legendLabelFormatOptions } from '../../dropdown-options';

@Component({
  selector: 'lg-section-settings',
  imports: [FormField, Dropdown],
  templateUrl: './section-settings.html',
  styleUrl: './section-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSettings {
  protected readonly legendLabelFormatOptions = legendLabelFormatOptions;
  protected readonly store = inject(PlotEditorStore);
}
