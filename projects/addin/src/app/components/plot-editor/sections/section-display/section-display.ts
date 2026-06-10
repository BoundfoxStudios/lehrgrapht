import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { PlotEditorStore } from '../../plot-editor.store';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { Input } from '../../../../ui/input/input';
import { SectionHint } from '../../../section-hint/section-hint';
import { Dropdown } from '../../../dropdown/dropdown';
import { PillSwitch, PillSwitchOption } from '../../../pill-switch/pill-switch';
import { ToggleRow } from '../../../toggle-row/toggle-row';
import { legendLabelFormatOptions } from '../../dropdown-options';
import { GridStep } from '../../../../models/plot';

@Component({
  selector: 'lg-section-display',
  imports: [
    DecimalPipe,
    FormField,
    ButtonDirective,
    Input,
    SectionHint,
    Dropdown,
    PillSwitch,
    ToggleRow,
  ],
  templateUrl: './section-display.html',
  styleUrl: './section-display.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionDisplay {
  protected readonly faInfoCircle = faInfoCircle;
  protected readonly legendLabelFormatOptions = legendLabelFormatOptions;

  protected readonly store = inject(PlotEditorStore);

  protected readonly gridStepOptions: PillSwitchOption<GridStep>[] = [
    { value: '0.5', label: '0,5' },
    { value: '1', label: '1' },
  ];

  protected readonly squareCount = computed(() => {
    const range = this.store.model().range;
    const x = (range.x.max - range.x.min) * 2;
    const y = (range.y.max - range.y.min) * 2;
    return `${x} / ${y}`;
  });
}
