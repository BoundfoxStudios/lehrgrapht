import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Dropdown } from '../../../dropdown/dropdown';
import { PlotEditorStore } from '../../plot-editor.store';
import { legendLabelFormatOptions } from '../../dropdown-options';
import { Input } from '../../../../ui/input/input';
import { Checkbox } from '../../../../ui/checkbox/checkbox';

@Component({
  selector: 'lg-section-settings',
  imports: [FormField, Dropdown, Input, Checkbox],
  templateUrl: './section-settings.html',
  styleUrl: './section-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSettings {
  protected readonly legendLabelFormatOptions = legendLabelFormatOptions;
  protected readonly store = inject(PlotEditorStore);
}
