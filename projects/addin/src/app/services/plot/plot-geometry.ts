import { PLOT_CONSTANTS } from './plot.types';

export interface SquareCounts {
  x: number;
  y: number;
}

export const squareCounts = (
  xRange: number,
  yRange: number,
  squarePlots: boolean,
): SquareCounts => {
  const { renderUnitsPerSquare } = PLOT_CONSTANTS;
  const largerRange = Math.max(xRange, yRange);

  return {
    x: (squarePlots ? largerRange : xRange) / renderUnitsPerSquare,
    y: (squarePlots ? largerRange : yRange) / renderUnitsPerSquare,
  };
};
