import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import { PlotEditorStore } from '../../plot-editor.store';

@Component({
  selector: 'lg-section-range',
  imports: [DecimalPipe, FormField],
  templateUrl: './section-range.html',
  styleUrl: './section-range.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionRange {
  protected readonly store = inject(PlotEditorStore);

  protected readonly squareCount = computed(() => {
    const range = this.store.model().range;
    const x = (range.x.max - range.x.min) * 2;
    const y = (range.y.max - range.y.min) * 2;
    return `${x} / ${y}`;
  });
}
