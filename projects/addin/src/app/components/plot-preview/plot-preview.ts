import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
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

  protected readonly hoverPosition = signal<{
    x: number;
    y: number;
    percentX: number;
    percentY: number;
  } | null>(null);

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

  private calculatePlotCoordinates(
    event: MouseEvent,
  ): { x: number; y: number; percentX: number; percentY: number } | null {
    const target = event.target as HTMLImageElement;
    const rect = target.getBoundingClientRect();

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const imageWidth = rect.width;
    const imageHeight = rect.height;

    const plot = this.plot();
    const range = plot.range;

    const xRange = range.x.max - range.x.min;
    const yRange = range.y.max - range.y.min;

    const mmPerTick = 5;
    const dtick = 0.5;
    const mmMargin = 7.5;

    const tickSquaresX = plot.squarePlots
      ? Math.max(xRange, yRange) / dtick
      : xRange / dtick;
    const tickSquaresY = plot.squarePlots
      ? Math.max(xRange, yRange) / dtick
      : yRange / dtick;

    const plotWidthMm = tickSquaresX * mmPerTick + mmMargin * 2;
    const plotHeightMm = tickSquaresY * mmPerTick + mmMargin * 2;

    const marginPercentX = mmMargin / plotWidthMm;
    const marginPercentY = mmMargin / plotHeightMm;

    const effectiveWidth = imageWidth * (1 - 2 * marginPercentX);
    const effectiveHeight = imageHeight * (1 - 2 * marginPercentY);
    const marginX = imageWidth * marginPercentX;
    const marginY = imageHeight * marginPercentY;

    const relativeX = (clickX - marginX) / effectiveWidth;
    const relativeY = 1 - (clickY - marginY) / effectiveHeight;

    let x = range.x.min + relativeX * xRange;
    let y = range.y.min + relativeY * yRange;

    x = Math.round(x * 2) / 2;
    y = Math.round(y * 2) / 2;

    x = Math.max(range.x.min, Math.min(range.x.max, x));
    y = Math.max(range.y.min, Math.min(range.y.max, y));

    const snappedRelativeX = (x - range.x.min) / xRange;
    const snappedRelativeY = (y - range.y.min) / yRange;
    const percentX =
      (marginPercentX + snappedRelativeX * (1 - 2 * marginPercentX)) * 100;
    const percentY =
      (marginPercentY + (1 - snappedRelativeY) * (1 - 2 * marginPercentY)) *
      100;

    return { x, y, percentX, percentY };
  }

  protected onImageClick(event: MouseEvent): void {
    if (!this.interactive()) {
      return;
    }

    const coords = this.calculatePlotCoordinates(event);
    if (coords) {
      this.plotClick.emit({ x: coords.x, y: coords.y });
    }
  }

  protected onImageMouseMove(event: MouseEvent): void {
    if (!this.interactive()) {
      this.hoverPosition.set(null);
      return;
    }

    const coords = this.calculatePlotCoordinates(event);
    this.hoverPosition.set(coords);
  }

  protected onImageMouseLeave(): void {
    this.hoverPosition.set(null);
  }
}
