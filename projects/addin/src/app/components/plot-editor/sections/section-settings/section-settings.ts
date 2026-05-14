import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Dropdown } from '../../../dropdown/dropdown';
import { PillSwitch, PillSwitchOption } from '../../../pill-switch/pill-switch';
import { ToggleRow } from '../../../toggle-row/toggle-row';
import { PlotEditorStore } from '../../plot-editor.store';
import { legendLabelFormatOptions } from '../../dropdown-options';
import { GridStep } from '../../../../models/plot';

@Component({
  selector: 'lg-section-settings',
  imports: [FormField, Dropdown, PillSwitch, ToggleRow],
  templateUrl: './section-settings.html',
  styleUrl: './section-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSettings {
  protected readonly legendLabelFormatOptions = legendLabelFormatOptions;
  protected readonly store = inject(PlotEditorStore);

  protected readonly gridStepOptions: PillSwitchOption<GridStep>[] = [
    { value: '0.5', label: '0,5' },
    { value: '1', label: '1' },
  ];
}
