import * as mathjs from 'mathjs';
import { Injectable } from '@angular/core';
import { Annotations } from 'plotly.js-dist-min';
import { Plot, PlotSettings } from '../../models/plot';

@Injectable({ providedIn: 'root' })
export class PlotAnnotationsService {
  buildAnnotations(
    plot: Plot,
    plotSettings: PlotSettings,
  ): Partial<Annotations>[] {
    const xAnnotationRange = mathjs
      .range(plot.range.x.min, plot.range.x.max, 1, true)
      .toArray() as number[];

    let yAnnotationRange = mathjs
      .range(plot.range.y.min, plot.range.y.max, 1, true)
      .toArray() as number[];

    if (xAnnotationRange.includes(0) && yAnnotationRange.includes(0)) {
      yAnnotationRange = yAnnotationRange.filter(y => y !== 0);
    }

    return [
      ...this.buildXLabels(xAnnotationRange),
      ...this.buildXTickLines(xAnnotationRange, plotSettings),
      ...this.buildYLabels(yAnnotationRange),
      ...this.buildYTickLines(yAnnotationRange, plotSettings),
    ];
  }

  buildXLabels(xRange: number[]): Partial<Annotations>[] {
    return xRange.slice(1, xRange.length - 1).map(x => ({
      x,
      y: 0,
      text: `${x}`,
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
      .slice(0, xRange.length - 1)
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
    return yRange.slice(1, yRange.length - 1).map(y => ({
      x: 0,
      y,
      text: `${y}`,
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
      .slice(0, yRange.length - 1)
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
      arrows.push(
        {
          x: 0.1,
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
          y: 0.55,
          text: plot.axisLabelX || 'x',
          showarrow: false,
          yanchor: 'top',
          xanchor: 'right',
          xref: 'paper',
          yref: 'y',
        },
      );
    }

    return arrows;
  }
}
