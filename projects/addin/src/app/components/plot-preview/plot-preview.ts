import { Component, computed, inject, input, output } from '@angular/core';
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

export interface PlotClickEvent {
  x: number;
  y: number;
}

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
  readonly interactive = input(false);
  readonly plotClick = output<PlotClickEvent>();

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

  protected onImageClick(event: MouseEvent): void {
    if (!this.interactive()) {
      return;
    }

    const target = event.target as HTMLImageElement;
    const rect = target.getBoundingClientRect();

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const imageWidth = target.clientWidth;
    const imageHeight = target.clientHeight;

    const plot = this.plot();
    const range = plot.range;

    const marginPercent = 0.05;
    const effectiveWidth = imageWidth * (1 - 2 * marginPercent);
    const effectiveHeight = imageHeight * (1 - 2 * marginPercent);
    const marginX = imageWidth * marginPercent;
    const marginY = imageHeight * marginPercent;

    const relativeX = (clickX - marginX) / effectiveWidth;
    const relativeY = 1 - (clickY - marginY) / effectiveHeight;

    const xRange = range.x.max - range.x.min;
    const yRange = range.y.max - range.y.min;

    let x = range.x.min + relativeX * xRange;
    let y = range.y.min + relativeY * yRange;

    x = Math.round(x * 2) / 2;
    y = Math.round(y * 2) / 2;

    x = Math.max(range.x.min, Math.min(range.x.max, x));
    y = Math.max(range.y.min, Math.min(range.y.max, y));

    this.plotClick.emit({ x, y });
  }
}
