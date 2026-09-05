import type {
  AxisSnapping,
  AxisSnappingPerAxis,
  GridStep,
  Plot,
  UnitsPerSquare,
} from '../../models/plot';
import { isFiniteNumber, PLOT_CONSTANTS } from './plot.types';

export interface SquareCounts {
  x: number;
  y: number;
}

export interface RenderScale {
  x: number;
  y: number;
}

export interface AxisRange {
  min: number;
  max: number;
}

export interface AxisRanges {
  x: AxisRange;
  y: AxisRange;
}

export interface SquareCountsInput extends AxisRanges {
  unitsPerSquare: Partial<UnitsPerSquare> | undefined;
  squarePlots: boolean;
}

export interface SnapRangesToGridInput extends AxisRanges {
  unitsPerSquare: Partial<UnitsPerSquare> | undefined;
  gridStep: GridStep;
  axisSnapping: Partial<AxisSnappingPerAxis> | undefined;
}

// Plots saved by a dev build carry version 0.0.0 and skip every migration, so a field can be missing
const usableOrDefault = (
  value: number | undefined,
  fallback: number,
): number => (isFiniteNumber(value) && value > 0 ? value : fallback);

export const effectiveUnitsPerSquare = (
  unitsPerSquare: Partial<UnitsPerSquare> | undefined,
): UnitsPerSquare => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;

  return {
    x: usableOrDefault(unitsPerSquare?.x, renderUnitsPerSquare),
    y: usableOrDefault(unitsPerSquare?.y, renderUnitsPerSquare),
  };
};

export const snapToSquare = (value: number, unitsPerSquare: number): number => {
  const squareIndex = Math.round(value / unitsPerSquare);

  // 3 * 0.2 is 0.6000000000000001, and such a value breaks the exact collinearity test of dedupePolygonPoints
  return Number((squareIndex * unitsPerSquare).toPrecision(12));
};

const effectiveAxisSnapping = (
  axisSnapping: Partial<AxisSnappingPerAxis> | undefined,
): AxisSnappingPerAxis => ({
  x: axisSnapping?.x === 'shrink' ? 'shrink' : 'extend',
  y: axisSnapping?.y === 'shrink' ? 'shrink' : 'extend',
});

// Plotly anchors the grid lines at zero, so a bound between two of them leaves a clipped grid cell at the edge
const snapAxisRange = (
  { min, max }: AxisRange,
  unitsPerSquare: number,
  gridStep: GridStep,
  snapping: AxisSnapping,
): AxisRange => {
  const gridInterval =
    2 * usableOrDefault(Number(gridStep), 1) * unitsPerSquare;

  // 1.2 / 0.1 is 11.999999999999998 and 3 * 0.1 is 0.30000000000000004, and either moves a bound off its grid line
  const multiplierAt = (bound: number): number =>
    Number((bound / gridInterval).toPrecision(12));
  const boundAt = (multiplier: number): number =>
    Number((multiplier * gridInterval).toPrecision(12));

  const snapsInwards = snapping === 'shrink';
  const minMultiplier = snapsInwards
    ? Math.ceil(multiplierAt(min))
    : Math.floor(multiplierAt(min));
  const maxMultiplier = snapsInwards
    ? Math.floor(multiplierAt(max))
    : Math.ceil(multiplierAt(max));

  return {
    min: boundAt(minMultiplier),
    // Snapping inwards can pull the maximum past the minimum, and an axis without extent has no grid at all
    max: boundAt(Math.max(maxMultiplier, minMultiplier + 1)),
  };
};

export const snapRangesToGrid = ({
  x,
  y,
  unitsPerSquare,
  gridStep,
  axisSnapping,
}: SnapRangesToGridInput): AxisRanges => {
  const scale = effectiveUnitsPerSquare(unitsPerSquare);
  const snapping = effectiveAxisSnapping(axisSnapping);

  return {
    x: snapAxisRange(x, scale.x, gridStep, snapping.x),
    y: snapAxisRange(y, scale.y, gridStep, snapping.y),
  };
};

export const squareCounts = ({
  x,
  y,
  unitsPerSquare,
  squarePlots,
}: SquareCountsInput): SquareCounts => {
  const scale = effectiveUnitsPerSquare(unitsPerSquare);

  // A snapped range spans whole squares, yet (0.3 - 0) / 0.1 is 2.9999999999999996 and would size the plot in fractions of a millimeter
  const countOf = (range: AxisRange, units: number): number =>
    Number(((range.max - range.min) / units).toPrecision(12));

  const xCount = countOf(x, scale.x);
  const yCount = countOf(y, scale.y);
  const largerCount = Math.max(xCount, yCount);

  return {
    x: squarePlots ? largerCount : xCount,
    y: squarePlots ? largerCount : yCount,
  };
};

// Square plots level the counts, and the added squares extend the maximum so the snapped minimum stays put
export const drawnAxisRange = (
  min: number,
  squares: number,
  unitsPerSquare: number,
): AxisRange => ({
  min,
  max: Number((min + squares * unitsPerSquare).toPrecision(12)),
});

export const renderScale = (plot: Plot): RenderScale => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;
  const scale = effectiveUnitsPerSquare(plot.unitsPerSquare);

  return {
    x: renderUnitsPerSquare / scale.x,
    y: renderUnitsPerSquare / scale.y,
  };
};

export interface AxisOrigin {
  x: number;
  y: number;
}

const originOn = ({ min, max }: AxisRange): number =>
  min > 0 ? min : max < 0 ? max : 0;

// Plotly hangs the axis line at zero, so a range without zero needs the crossing moved to its nearest edge
export const axisOrigin = ({ x, y }: AxisRanges): AxisOrigin => ({
  x: originOn(x),
  y: originOn(y),
});

export const gridMultipliers = (
  min: number,
  max: number,
  step: number,
): number[] => {
  if (!isFiniteNumber(step) || step <= 0) {
    return [];
  }

  const epsilon = (max - min) * 1e-9;
  const firstMultiplier = Math.ceil((min - epsilon) / step);
  const lastMultiplier = Math.floor((max + epsilon) / step);
  const multipliers: number[] = [];

  // Math.ceil returns -0 for a range starting just below zero, and Plotly drops the grid line only on exactly 0
  for (
    let multiplier = firstMultiplier === 0 ? 0 : firstMultiplier;
    multiplier <= lastMultiplier;
    multiplier++
  ) {
    multipliers.push(multiplier);
  }

  return multipliers;
};

// Plotly writes negative tick labels with U+2212, but skips its own number formatting for tickmode 'array'
export const formatAxisValue = (value: number): string => {
  const text = `${Number(value.toPrecision(12))}`;

  return text.startsWith('-') ? `−${text.slice(1)}` : text;
};

export interface AxisTicks {
  tickvals: number[];
  ticktext: string[];
}

export const buildAxisTicks = (
  dataMin: number,
  dataMax: number,
  dataStep: number,
  factor: number,
): AxisTicks => {
  if (!isFiniteNumber(dataStep) || dataStep <= 0) {
    return { tickvals: [], ticktext: [] };
  }

  if (dataMin === dataMax) {
    return {
      tickvals: [dataMin * factor],
      ticktext: [formatAxisValue(dataMin)],
    };
  }

  const multipliers = gridMultipliers(dataMin, dataMax, dataStep);

  return {
    tickvals: multipliers.map(multiplier => multiplier * dataStep * factor),
    ticktext: multipliers.map(multiplier =>
      multiplier % 2 === 0 ? formatAxisValue(multiplier * dataStep) : '',
    ),
  };
};
