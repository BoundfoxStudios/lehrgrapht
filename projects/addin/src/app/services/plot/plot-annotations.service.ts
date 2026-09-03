import { Injectable } from '@angular/core';
import { Annotations } from 'plotly.js-dist-min';
import { Plot, PlotSettings } from '../../models/plot';
import {
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
  ): Partial<Annotations>[] {
    const unitsPerSquare = effectiveUnitsPerSquare(plot.unitsPerSquare);
    const xAnnotationRange = gridValues(plot.range.x, 2 * unitsPerSquare.x);

    let yAnnotationRange = gridValues(plot.range.y, 2 * unitsPerSquare.y);

    if (xAnnotationRange.includes(0) && yAnnotationRange.includes(0)) {
      yAnnotationRange = yAnnotationRange.filter(y => y !== 0);
    }

    return [
      ...this.buildXLabels(withoutBounds(xAnnotationRange, plot.range.x)),
      ...this.buildXTickLines(
        withoutMaximum(xAnnotationRange, plot.range.x),
        plotSettings,
      ),
      ...this.buildYLabels(withoutBounds(yAnnotationRange, plot.range.y)),
      ...this.buildYTickLines(
        withoutMaximum(yAnnotationRange, plot.range.y),
        plotSettings,
      ),
    ];
  }

  buildXLabels(xRange: number[]): Partial<Annotations>[] {
    return xRange.map(x => ({
      x,
      y: 0,
      text: formatAxisValue(x),
      xref: 'x',
      yref: 'y',
      showarrow: false,
      xanchor: 'center',
      yanchor: 'top',
      yshift: -2,
      xshift: x === 0 ? 6 : undefined,
      font: { size: 10 },
    }));
  }

  buildXTickLines(
    xRange: number[],
    plotSettings: PlotSettings,
  ): Partial<Annotations>[] {
    return xRange
      .filter(x => x !== 0)
      .map(x => ({
        x,
        y: 0,
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

  buildYLabels(yRange: number[]): Partial<Annotations>[] {
    return yRange.map(y => ({
      x: 0,
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
  ): Partial<Annotations>[] {
    return yRange
      .filter(y => y !== 0)
      .map(y => ({
        x: 0,
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
  ): Partial<Annotations>[] {
    if (!plot.showAxisArrows) {
      return plot.showAxisLabels ? this.buildAxisLabels(plot) : [];
    }

    const arrows: Partial<Annotations>[] = [
      {
        x: xValueMax,
        y: 0,
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
        x: 0,
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
      arrows.push(...this.buildAxisLabels(plot));
    }

    return arrows;
  }

  private buildAxisLabels(plot: Plot): Partial<Annotations>[] {
    const unitsPerSquare = effectiveUnitsPerSquare(plot.unitsPerSquare);

    return [
      {
        x: 0.2 * unitsPerSquare.x,
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
        y: 1.1 * unitsPerSquare.y,
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
