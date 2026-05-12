import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Dropdown } from '../../../dropdown/dropdown';
import { PillSwitch, PillSwitchOption } from '../../../pill-switch/pill-switch';
import { ToggleRow } from '../../../toggle-row/toggle-row';
import {
  ColorSwatchOption,
  ColorSwatchRow,
} from '../../../color-swatch-row/color-swatch-row';
import { PlotEditorStore } from '../../plot-editor.store';
import { legendLabelFormatOptions } from '../../dropdown-options';
import { AspectRatio, GridStep } from '../../../../models/plot';

@Component({
  selector: 'lg-section-settings',
  imports: [FormField, Dropdown, PillSwitch, ToggleRow, ColorSwatchRow],
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
    { value: '2', label: '2' },
  ];

  protected readonly aspectRatioOptions: PillSwitchOption<AspectRatio>[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'square', label: '1 : 1' },
    { value: 'wide', label: '4 : 3' },
  ];

  protected readonly backgroundOptions: ColorSwatchOption[] = [
    { value: 'white', color: '#ffffff', label: 'Weiß' },
    { value: 'soft', color: '#f7f8fc', label: 'Hellgrau' },
    { value: 'paper', color: '#fdf6e3', label: 'Papier' },
  ];
}
