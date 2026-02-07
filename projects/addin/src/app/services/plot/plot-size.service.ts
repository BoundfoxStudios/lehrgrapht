import * as mathjs from 'mathjs';
import { Injectable } from '@angular/core';
import { Plot } from '../../models/plot';
import {
  A4_USABLE_HEIGHT_MM,
  A4_USABLE_WIDTH_MM,
  CleanedValues,
  PLOT_CONSTANTS,
  PlotMarginMm,
  PlotSizeCalculation,
  PlotSizeMm,
  ValueRanges,
} from './plot.types';

@Injectable({ providedIn: 'root' })
export class PlotSizeService {
  calculatePlotSize(
    plot: Plot,
    cleanedValues: CleanedValues,
    valueRanges: ValueRanges,
    margin: PlotMarginMm,
  ): PlotSizeCalculation {
    const { dtick, mmPerTick, mmToInches, mmToPoints, ppiBase } =
      PLOT_CONSTANTS;

    const xValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanedValues.cleanXValues
      : valueRanges.xNumbers;
    const xValueMin = mathjs.min(xValueFlat);
    const xValueMax = mathjs.max(xValueFlat);
    const xValueRange = xValueMax - xValueMin;

    const yValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanedValues.cleanYValues.flatMap(y => y)
      : valueRanges.yNumbers;
    const yValueMin = mathjs.min(yValueFlat);
    const yValueMax = mathjs.max(yValueFlat);
    const yValueRange = yValueMax - yValueMin;

    const tickSquares = {
      x: plot.squarePlots
        ? Math.max(xValueRange, yValueRange) / dtick
        : xValueRange / dtick,
      y: plot.squarePlots
        ? Math.max(xValueRange, yValueRange) / dtick
        : yValueRange / dtick,
    };

    const plotSizeMm = {
      width: tickSquares.x * mmPerTick + margin.l + margin.r,
      height: tickSquares.y * mmPerTick + margin.t + margin.b,
    };

    return {
      xValueMin,
      xValueMax,
      yValueMin,
      yValueMax,
      plotSizePx: {
        width: plotSizeMm.width * mmToInches * ppiBase,
        height: plotSizeMm.height * mmToInches * ppiBase,
      },
      plotSizePoints: {
        width: plotSizeMm.width * mmToPoints,
        height: plotSizeMm.height * mmToPoints,
      },
    };
  }

  calculateEffectiveMargin(plot: Plot): PlotMarginMm {
    const base = PLOT_CONSTANTS.mmMargin;
    let extraLeft = 0;
    let extraRight = 0;

    const pxPerChar = 6;
    const xshiftPx = 5;
    const pxToMm = 25.4 / PLOT_CONSTANTS.ppiBase;

    for (const fn of plot.fnx) {
      if (fn.legendPosition === 'none') continue;

      const textWidthMm = (fn.fnx.length * pxPerChar + xshiftPx) * pxToMm;
      const extraNeeded = Math.max(0, textWidthMm - base.l);

      if (fn.legendPosition === 'start') {
        extraLeft = Math.max(extraLeft, extraNeeded);
      } else {
        extraRight = Math.max(extraRight, extraNeeded);
      }
    }

    return {
      t: base.t,
      b: base.b,
      l: base.l + extraLeft,
      r: base.r + extraRight,
    };
  }

  calculatePlotSizeMm(plot: Plot): PlotSizeMm {
    const { dtick, mmPerTick } = PLOT_CONSTANTS;
    const margin = this.calculateEffectiveMargin(plot);
    const xRange = plot.range.x.max - plot.range.x.min;
    const yRange = plot.range.y.max - plot.range.y.min;

    const tickSquaresX = plot.squarePlots
      ? Math.max(xRange, yRange) / dtick
      : xRange / dtick;
    const tickSquaresY = plot.squarePlots
      ? Math.max(xRange, yRange) / dtick
      : yRange / dtick;

    const width = tickSquaresX * mmPerTick + margin.l + margin.r;
    const height = tickSquaresY * mmPerTick + margin.t + margin.b;

    const exceedsWidth = width > A4_USABLE_WIDTH_MM;
    const exceedsHeight = height > A4_USABLE_HEIGHT_MM;

    return {
      width,
      height,
      exceedsA4: exceedsWidth || exceedsHeight,
      exceedsWidth,
      exceedsHeight,
    };
  }
}
