import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FieldTree, FormField } from '@angular/forms/signals';
import { Plot } from '../../../../models/plot';
import { PlotSizeMm } from '../../../../services/plot/plot.types';

@Component({
  selector: 'lg-section-range',
  imports: [DecimalPipe, FormField],
  templateUrl: './section-range.html',
  styleUrl: './section-range.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRange {
  readonly editorForm = input.required<FieldTree<Plot>>();
  readonly editorModel = input.required<Plot>();
  readonly plotSizeMm = input.required<PlotSizeMm>();
  readonly autoAdjust = output();

  protected readonly squareCount = computed(() => {
    const range = this.editorModel().range;
    const x = (range.x.max - range.x.min) * 2;
    const y = (range.y.max - range.y.min) * 2;
    return `${x} / ${y}`;
  });
}
