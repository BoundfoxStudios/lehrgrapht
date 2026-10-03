import { Injectable } from '@angular/core';
import { PlotAnnotation } from './render-space';
import { Plot, PlotSettings } from '../../models/plot';
import {
  AxisOrigin,
  effectiveUnitsPerSquare,
  formatAxisValue,
  gridMultipliers,
} from './plot-geometry';

interface AxisBounds {
  min: number;
  max: number;
}

const gridValues = (bounds: AxisBounds, step: number): number[] =>
  gridMultipliers(bounds.min, bounds.max, step).map(
    multiplier => multiplier * step,
  );

const withoutBounds = (values: number[], bounds: AxisBounds): number[] =>
  values.filter(value => value > bounds.min && value < bounds.max);

const withoutMaximum = (values: number[], bounds: AxisBounds): number[] =>
  values.filter(value => value < bounds.max);

@Injectable({ providedIn: 'root' })
export class PlotAnnotationsService {
  buildAnnotations(
    plot: Plot,
    plotSettings: PlotSettings,
    origin: AxisOrigin,
  ): PlotAnnotation[] {
    const unitsPerSquare = effectiveUnitsPerSquare(plot.unitsPerSquare);
    const xAnnotationRange = gridValues(plot.range.x, 2 * unitsPerSquare.x);

    let yAnnotationRange = gridValues(plot.range.y, 2 * unitsPerSquare.y);

    if (
      xAnnotationRange.includes(origin.x) &&
      yAnnotationRange.includes(origin.y)
    ) {
      yAnnotationRange = yAnnotationRange.filter(y => y !== origin.y);
    }

    return [
      ...this.buildXLabels(
        withoutBounds(xAnnotationRange, plot.range.x),
        origin,
      ),
      ...this.buildXTickLines(
        withoutMaximum(xAnnotationRange, plot.range.x),
        plotSettings,
        origin,
      ),
      ...this.buildYLabels(
        withoutBounds(yAnnotationRange, plot.range.y),
        origin,
      ),
      ...this.buildYTickLines(
        withoutMaximum(yAnnotationRange, plot.range.y),
        plotSettings,
        origin,
      ),
    ];
  }

  buildXLabels(xRange: number[], origin: AxisOrigin): PlotAnnotation[] {
    return xRange.map(x => ({
      x,
      y: origin.y,
      text: formatAxisValue(x),
      xref: 'x',
      yref: 'y',
      showarrow: false,
      xanchor: 'center',
      yanchor: 'top',
      yshift: -2,
      xshift: x === origin.x ? 6 : undefined,
      font: { size: 10 },
    }));
  }

  buildXTickLines(
    xRange: number[],
    plotSettings: PlotSettings,
    origin: AxisOrigin,
  ): PlotAnnotation[] {
    return xRange
      .filter(x => x !== origin.x)
      .map(x => ({
        x,
        y: origin.y,
        xref: 'x',
        yref: 'y',
        showarrow: true,
        xanchor: 'center',
        yanchor: 'top',
        ax: 0,
        ay: 4 * plotSettings.zeroLineWidth,
        yshift: 2 * plotSettings.zeroLineWidth,
        arrowhead: 0,
        arrowwidth: plotSettings.zeroLineWidth,
      }));
  }

  buildYLabels(yRange: number[], origin: AxisOrigin): PlotAnnotation[] {
    return yRange.map(y => ({
      x: origin.x,
      y,
      text: formatAxisValue(y),
      xref: 'x',
      yref: 'y',
      xshift: -4,
      showarrow: false,
      xanchor: 'right',
      yanchor: 'middle',
      font: { size: 10 },
    }));
  }

  buildYTickLines(
    yRange: number[],
    plotSettings: PlotSettings,
    origin: AxisOrigin,
  ): PlotAnnotation[] {
    return yRange
      .filter(y => y !== origin.y)
      .map(y => ({
        x: origin.x,
        y,
        xref: 'x',
        yref: 'y',
        showarrow: true,
        xanchor: 'left',
        yanchor: 'middle',
        ax: 4 * plotSettings.zeroLineWidth,
        xshift: -2 * plotSettings.zeroLineWidth,
        ay: 0,
        arrowhead: 0,
        arrowwidth: plotSettings.zeroLineWidth,
      }));
  }

  buildArrows(
    plot: Plot,
    plotSettings: PlotSettings,
    xValueMax: number,
    yValueMax: number,
    origin: AxisOrigin,
  ): PlotAnnotation[] {
    if (!plot.showAxisArrows) {
      return plot.showAxisLabels ? this.buildAxisLabels(plot, origin) : [];
    }

    const arrows: PlotAnnotation[] = [
      {
        x: xValueMax,
        y: origin.y,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: -20,
        ay: 0,
        arrowwidth: plotSettings.zeroLineWidth,
        arrowhead: 2,
        arrowcolor: plotSettings.zeroLineColor,
      },
      {
        x: origin.x,
        y: yValueMax,
        showarrow: true,
        xref: 'x',
        yref: 'y',
        ax: 0,
        ay: 20,
        arrowwidth: plotSettings.zeroLineWidth,
        arrowhead: 2,
        arrowcolor: plotSettings.zeroLineColor,
      },
    ];

    if (plot.showAxisLabels) {
      arrows.push(...this.buildAxisLabels(plot, origin));
    }

    return arrows;
  }

  private buildAxisLabels(plot: Plot, origin: AxisOrigin): PlotAnnotation[] {
    const unitsPerSquare = effectiveUnitsPerSquare(plot.unitsPerSquare);

    return [
      {
        x: origin.x + 0.2 * unitsPerSquare.x,
        y: 1.01,
        text: plot.axisLabelY || 'y',
        showarrow: false,
        yanchor: 'top',
        xanchor: 'left',
        xref: 'x',
        yref: 'paper',
      },
      {
        x: 1,
        y: origin.y + 1.1 * unitsPerSquare.y,
        text: plot.axisLabelX || 'x',
        showarrow: false,
        yanchor: 'top',
        xanchor: 'right',
        xref: 'paper',
        yref: 'y',
      },
    ];
  }
}
