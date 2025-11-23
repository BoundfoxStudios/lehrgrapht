import { Component, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MathFunction, PlotService } from '../../services/plot.service';
import { switchMap } from 'rxjs';
import { PlotRange } from '../../models/plot-range';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-plot-preview',
  imports: [AsyncPipe],
  templateUrl: './plot-preview.html',
  styleUrl: './plot-preview.css',
})
export class PlotPreview {
  private readonly plotService = inject(PlotService);

  readonly fnx = input.required<MathFunction[]>();
  readonly range = input.required<PlotRange>();
  readonly showAxisLabels = input.required<boolean>();
  readonly placeAxisLabelsInside = input.required<boolean>();

  private readonly model = computed(() => ({
    fnx: this.fnx(),
    range: this.range(),
    showAxisLabels: this.showAxisLabels(),
    placeAxisLabelsInside: this.placeAxisLabelsInside(),
  }));

  preview$ = toObservable(this.model).pipe(
    switchMap(({ fnx, range, showAxisLabels, placeAxisLabelsInside }) =>
      this.plotService.generate({
        fnx,
        range,
        showAxisLabels,
        placeAxisLabelsInside,
      }),
    ),
  );
}
