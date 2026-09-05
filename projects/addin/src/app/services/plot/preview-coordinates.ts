import { UnitsPerSquare } from '../../models/plot';
import { AxisRanges, SquareCounts, snapToSquare } from './plot-geometry';
import { PLOT_CONSTANTS, PlotMarginMm } from './plot.types';

export interface PreviewGeometry {
  squares: SquareCounts;
  drawnRange: AxisRanges;
  unitsPerSquare: UnitsPerSquare;
  margin: PlotMarginMm;
}

export interface PreviewPointer {
  x: number;
  y: number;
  imageWidth: number;
  imageHeight: number;
}

export interface PreviewCoordinates {
  x: number;
  y: number;
  percentX: number;
  percentY: number;
}

export const previewPointToPlotCoordinates = (
  { squares, drawnRange, unitsPerSquare, margin }: PreviewGeometry,
  pointer: PreviewPointer,
): PreviewCoordinates | null => {
  const { mmPerSquare } = PLOT_CONSTANTS;

  const imageWidthMm = squares.x * mmPerSquare + margin.l + margin.r;
  const imageHeightMm = squares.y * mmPerSquare + margin.t + margin.b;

  const leftFraction = margin.l / imageWidthMm;
  const topFraction = margin.t / imageHeightMm;
  const widthFraction = (squares.x * mmPerSquare) / imageWidthMm;
  const heightFraction = (squares.y * mmPerSquare) / imageHeightMm;

  const relativeX =
    (pointer.x - pointer.imageWidth * leftFraction) /
    (pointer.imageWidth * widthFraction);
  const relativeY =
    1 -
    (pointer.y - pointer.imageHeight * topFraction) /
      (pointer.imageHeight * heightFraction);

  if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
    return null;
  }

  const xRange = drawnRange.x.max - drawnRange.x.min;
  const yRange = drawnRange.y.max - drawnRange.y.min;

  const x = snapToSquare(
    drawnRange.x.min + relativeX * xRange,
    unitsPerSquare.x,
  );
  const y = snapToSquare(
    drawnRange.y.min + relativeY * yRange,
    unitsPerSquare.y,
  );

  const snappedRelativeX = (x - drawnRange.x.min) / xRange;
  const snappedRelativeY = (y - drawnRange.y.min) / yRange;

  return {
    x,
    y,
    percentX: (leftFraction + snappedRelativeX * widthFraction) * 100,
    percentY: (topFraction + (1 - snappedRelativeY) * heightFraction) * 100,
  };
};
