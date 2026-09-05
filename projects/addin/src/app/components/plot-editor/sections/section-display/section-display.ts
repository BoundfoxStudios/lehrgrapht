import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { PlotEditorStore } from '../../plot-editor.store';
import { ButtonDirective } from '../../../../ui/button/button.directive';
import { TooltipDirective } from '../../../../ui/tooltip/tooltip.directive';
import { Input } from '../../../../ui/input/input';
import { SectionHint } from '../../../section-hint/section-hint';
import { Dropdown } from '../../../dropdown/dropdown';
import { PillSwitch, PillSwitchOption } from '../../../pill-switch/pill-switch';
import { ToggleRow } from '../../../toggle-row/toggle-row';
import { legendLabelFormatOptions } from '../../dropdown-options';
import { AxisSnapping, GridStep } from '../../../../models/plot';
import {
  formatAxisValue,
  snapRangesToGrid,
  squareCounts,
} from '../../../../services/plot/plot-geometry';
import { hasAxisReflectionScaleConflict } from '../../../../services/plot/reflection';

@Component({
  selector: 'lg-section-display',
  imports: [
    DecimalPipe,
    FormField,
    FaIconComponent,
    ButtonDirective,
    TooltipDirective,
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
    { value: '0.5', label: 'jedes' },
    { value: '1', label: 'jedes 2.' },
  ];

  protected readonly axisSnappingOptions: PillSwitchOption<AxisSnapping>[] = [
    { value: 'extend', label: 'Erweitern' },
    { value: 'shrink', label: 'Kürzen' },
  ];

  protected readonly axisReflectionConflict = computed(() => {
    const model = this.store.model();

    return hasAxisReflectionScaleConflict(
      model.reflection,
      model.unitsPerSquare,
    );
  });

  private readonly drawnRange = computed(() => {
    const model = this.store.model();
    const snapped = snapRangesToGrid({
      x: model.range.x,
      y: model.range.y,
      unitsPerSquare: model.unitsPerSquare,
      gridStep: model.gridStep,
      axisSnapping: model.axisSnapping,
    });

    return {
      ...snapped,
      squares: squareCounts({
        ...snapped,
        unitsPerSquare: model.unitsPerSquare,
        squarePlots: false,
      }),
    };
  });

  protected readonly squareCount = computed(() => {
    const squares = this.drawnRange().squares;
    return `${squares.x} / ${squares.y}`;
  });

  protected readonly drawnRangeHint = computed(() => {
    const range = this.store.model().range;
    const drawn = this.drawnRange();
    const axes: string[] = [];

    if (drawn.x.min !== range.x.min || drawn.x.max !== range.x.max) {
      axes.push(
        `x von ${formatBound(drawn.x.min)} bis ${formatBound(drawn.x.max)}`,
      );
    }
    if (drawn.y.min !== range.y.min || drawn.y.max !== range.y.max) {
      axes.push(
        `y von ${formatBound(drawn.y.min)} bis ${formatBound(drawn.y.max)}`,
      );
    }

    return axes.length ? `Am Gitter ausgerichtet: ${axes.join(', ')}` : null;
  });
}

const formatBound = (value: number): string =>
  formatAxisValue(value).replace('.', ',');
