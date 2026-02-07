import { Matrix } from 'mathjs';

export enum PlotGenerateErrorCode {
  /**
   * Happens during the compilation of the math expressions.
   */
  compile,

  /**
   * Happens during the evalution of the compiled math expressions.
   */
  evaluate,

  /**
   * Happens during plot generation.
   */
  plot,
}

export const plotHasErrorCode = (
  plot: unknown,
): plot is PlotGenerateErrorCode => {
  return (
    plot === PlotGenerateErrorCode.compile ||
    plot === PlotGenerateErrorCode.evaluate ||
    plot === PlotGenerateErrorCode.plot
  );
};

export const A4_USABLE_WIDTH_MM = 180;
export const A4_USABLE_HEIGHT_MM = 267;

export interface PlotSizeMm {
  width: number;
  height: number;
  exceedsA4: boolean;
  exceedsWidth: boolean;
  exceedsHeight: boolean;
}

export interface ValueRanges {
  x: Matrix;
  xNumbers: number[];
  xMin: number;
  xMax: number;
  y: Matrix;
  yNumbers: number[];
  yMin: number;
  yMax: number;
}

export interface PlotSizeCalculation {
  xValueMin: number;
  xValueMax: number;
  yValueMin: number;
  yValueMax: number;
  plotSizePx: { width: number; height: number };
  plotSizePoints: { width: number; height: number };
}

export interface CleanedValues {
  cleanXValues: number[];
  cleanYValues: number[][];
  xValuesArray: number[];
  yValuesArray: number[][];
}

export interface PlotMarginMm {
  t: number;
  b: number;
  l: number;
  r: number;
}

export const PLOT_CONSTANTS = {
  mmToInches: 1 / 25.4,
  mmToPoints: 72 / 25.4,
  ppiBase: 96,
  dtick: 0.5,
  mmPerTick: 5,
  mmMargin: { t: 7.5, b: 7.5, l: 7.5, r: 7.5 },
} as const;

export const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
