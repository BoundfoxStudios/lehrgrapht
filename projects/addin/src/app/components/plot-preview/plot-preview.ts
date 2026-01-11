import { Component, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  PlotGenerateErrorCode,
  plotHasErrorCode,
  PlotService,
} from '../../services/plot.service';
import { switchMap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Plot, PlotSettings } from '../../models/plot';
import { ContentContainer } from '../content-container/content-container';

@Component({
  selector: 'lg-plot-preview',
  imports: [AsyncPipe, ContentContainer],
  templateUrl: './plot-preview.html',
  styleUrl: './plot-preview.css',
})
export class PlotPreview {
  private readonly plotService = inject(PlotService);

  readonly plot = input.required<Plot>();
  readonly plotSettings = input.required<PlotSettings>();

  private readonly model = computed(() => ({
    plot: this.plot(),
    plotSettings: this.plotSettings(),
  }));

  preview$ = toObservable(this.model).pipe(
    switchMap(({ plot, plotSettings }) =>
      this.plotService.generate(plot, plotSettings, {
        applyScaleFactor: true,
      }),
    ),
  );
  protected readonly plotHasErrorCode = plotHasErrorCode;
  protected readonly PlotGenerateErrorCode = PlotGenerateErrorCode;
}
