import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { PlotService } from '../../services/plot/plot.service';
import {
  PlotGenerateErrorCode,
  plotHasErrorCode,
  PlotMarginMm,
} from '../../services/plot/plot.types';
import {
  drawnAxisRange,
  effectiveUnitsPerSquare,
  snapRangesToGrid,
  squareCounts,
} from '../../services/plot/plot-geometry';
import {
  PreviewCoordinates,
  previewPointToPlotCoordinates,
} from '../../services/plot/preview-coordinates';
import { switchMap, tap } from 'rxjs';
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
  readonly highlightedPolygonIndex = input<number | null>(null);
  readonly showSolution = input(true);
  readonly plotClick = output<PlotClickEvent>();

  protected readonly hoverPosition = signal<PreviewCoordinates | null>(null);

  private readonly renderedMargin = signal<PlotMarginMm | null>(null);

  private readonly model = computed(() => ({
    plot: this.plot(),
    plotSettings: this.plotSettings(),
    highlightedPolygonIndex: this.highlightedPolygonIndex(),
    showSolution: this.showSolution(),
  }));

  preview$ = toObservable(this.model).pipe(
    switchMap(({ plot, plotSettings, highlightedPolygonIndex, showSolution }) =>
      this.plotService.generate(plot, plotSettings, {
        applyScaleFactor: true,
        highlightedPolygonIndex,
        showSolution,
      }),
    ),
    tap(preview => {
      this.renderedMargin.set(
        plotHasErrorCode(preview) ? null : preview.marginMm,
      );
    }),
  );
  protected readonly plotHasErrorCode = plotHasErrorCode;
  protected readonly PlotGenerateErrorCode = PlotGenerateErrorCode;

  private calculatePlotCoordinates(
    event: MouseEvent,
  ): PreviewCoordinates | null {
    const margin = this.renderedMargin();
    if (!margin) {
      return null;
    }

    const rect = (event.target as HTMLImageElement).getBoundingClientRect();
    const plot = this.plot();
    const unitsPerSquare = effectiveUnitsPerSquare(plot.unitsPerSquare);

    const snapped = snapRangesToGrid({
      x: plot.range.x,
      y: plot.range.y,
      unitsPerSquare: plot.unitsPerSquare,
      gridStep: plot.gridStep,
      axisSnapping: plot.axisSnapping,
    });

    const squares = squareCounts({
      ...snapped,
      unitsPerSquare: plot.unitsPerSquare,
      squarePlots: plot.squarePlots,
    });

    return previewPointToPlotCoordinates(
      {
        squares,
        drawnRange: {
          x: drawnAxisRange(snapped.x.min, squares.x, unitsPerSquare.x),
          y: drawnAxisRange(snapped.y.min, squares.y, unitsPerSquare.y),
        },
        unitsPerSquare,
        margin,
      },
      {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        imageWidth: rect.width,
        imageHeight: rect.height,
      },
    );
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
