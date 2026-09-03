import { Injectable } from '@angular/core';
import { Plot } from '../../models/plot';
import { math } from '../../utils/math';
import { squareCounts } from './plot-geometry';
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
    const { mmPerSquare, mmToInches, mmToPoints, ppiBase } = PLOT_CONSTANTS;

    const xValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanedValues.cleanXValues
      : valueRanges.xNumbers;
    const xValueMin = math.min(xValueFlat);
    const xValueMax = math.max(xValueFlat);
    const xValueRange = xValueMax - xValueMin;

    const yValueFlat = plot.automaticallyAdjustLimitsToValueRange
      ? cleanedValues.cleanYValues.flatMap(y => y)
      : valueRanges.yNumbers;
    const yValueMin = math.min(yValueFlat);
    const yValueMax = math.max(yValueFlat);
    const yValueRange = yValueMax - yValueMin;

    const squares = squareCounts(xValueRange, yValueRange, plot.squarePlots);

    const plotSizeMm = {
      width: squares.x * mmPerSquare + margin.l + margin.r,
      height: squares.y * mmPerSquare + margin.t + margin.b,
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

  calculateEffectiveMargin(
    plot: Plot,
    labelWidthsPx?: ReadonlyMap<number, number>,
  ): PlotMarginMm {
    const base = PLOT_CONSTANTS.mmMargin;
    let extraLeft = 0;
    let extraRight = 0;

    const xshiftPx = 5;
    const pxToMm = 25.4 / PLOT_CONSTANTS.ppiBase;

    for (let i = 0; i < plot.fnx.length; i++) {
      const fn = plot.fnx[i];
      if (fn.legendPosition === 'none') {
        continue;
      }

      const measuredPx = labelWidthsPx?.get(i);
      const textWidthMm =
        measuredPx !== undefined
          ? (measuredPx + xshiftPx) * pxToMm
          : this.estimateLabelWidthMm(fn.fnx, plot.legendLabelFormat);
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

  private estimateLabelWidthMm(
    expression: string,
    format: Plot['legendLabelFormat'],
  ): number {
    // Conservative heuristic used when MathJax-measured widths are unavailable
    // (e.g. live preview before async render). Math-mode rendering pads
    // operators (`+`, `-`, `=`, `\cdot`) and renders multi-letter identifiers
    // (`sin`, `cos`) in upright text, so the avg width per character is larger
    // than plain text. Empirically ~8 px/char at 10 px font size.
    const pxPerChar = 8;
    const xshiftPx = 5;
    const pxToMm = 25.4 / PLOT_CONSTANTS.ppiBase;

    let prefixChars = 0;
    if (format === 'f(x)=') {
      prefixChars = 8;
    } else if (format === 'y=') {
      prefixChars = 4;
    }
    return ((expression.length + prefixChars) * pxPerChar + xshiftPx) * pxToMm;
  }

  calculatePlotSizeMm(plot: Plot): PlotSizeMm {
    const margin = this.calculateEffectiveMargin(plot);
    const squares = squareCounts(
      plot.range.x.max - plot.range.x.min,
      plot.range.y.max - plot.range.y.min,
      plot.squarePlots,
    );

    const width = squares.x * PLOT_CONSTANTS.mmPerSquare + margin.l + margin.r;
    const height = squares.y * PLOT_CONSTANTS.mmPerSquare + margin.t + margin.b;

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
