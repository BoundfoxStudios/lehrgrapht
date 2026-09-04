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
import { GridStep, SquareRounding } from '../../../../models/plot';
import {
  drawnAxisRange,
  effectiveUnitsPerSquare,
  squareCounts,
} from '../../../../services/plot/plot-geometry';

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
    { value: '0.5', label: 'jedes' },
    { value: '1', label: 'jedes 2.' },
  ];

  protected readonly squareRoundingOptions: PillSwitchOption<SquareRounding>[] =
    [
      { value: 'up', label: 'Auf' },
      { value: 'down', label: 'Ab' },
    ];

  private readonly drawnRange = computed(() => {
    const model = this.store.model();
    const range = model.range;
    const unitsPerSquare = effectiveUnitsPerSquare(model.unitsPerSquare);
    const squares = squareCounts({
      xRange: range.x.max - range.x.min,
      yRange: range.y.max - range.y.min,
      unitsPerSquare: model.unitsPerSquare,
      squareRounding: model.squareRounding,
      squarePlots: false,
    });

    return {
      squares,
      x: drawnAxisRange(range.x.min, squares.x, unitsPerSquare.x),
      y: drawnAxisRange(range.y.min, squares.y, unitsPerSquare.y),
    };
  });

  protected readonly squareCount = computed(() => {
    const squares = this.drawnRange().squares;
    return `${squares.x} / ${squares.y}`;
  });

  protected readonly roundedMaximumHint = computed(() => {
    const range = this.store.model().range;
    const drawn = this.drawnRange();
    const axes: string[] = [];

    if (drawn.x.max !== range.x.max) {
      axes.push(`x bis ${drawn.x.max}`);
    }
    if (drawn.y.max !== range.y.max) {
      axes.push(`y bis ${drawn.y.max}`);
    }

    return axes.length
      ? `Für ganze Kästchen gezeichnet: ${axes.join(', ')}`
      : null;
  });
}
