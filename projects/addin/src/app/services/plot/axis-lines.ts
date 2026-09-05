import type { Shape } from 'plotly.js-dist-min';
import { PlotSettings } from '../../models/plot';
import type {
  AxisOrigin,
  AxisRange,
  AxisRanges,
  RenderScale,
} from './plot-geometry';

const isAtEdge = (origin: number, { min, max }: AxisRange): boolean =>
  origin === min || origin === max;

export const buildAxisLines = (
  origin: AxisOrigin,
  axisRange: AxisRanges,
  scale: RenderScale,
  plotSettings: PlotSettings,
): Partial<Shape>[] => {
  const line = {
    color: plotSettings.zeroLineColor,
    width: plotSettings.zeroLineWidth,
  };
  const shapes: Partial<Shape>[] = [];

  // Plotly omits the zero line when zero is outside the range and cuts it off where it falls on the plot edge
  if (isAtEdge(origin.x, axisRange.x)) {
    shapes.push({
      type: 'line',
      // A paper-referenced end forces the shape into the lower layer on any setting but 'above', where the grid and the plot frame would draw over the axis
      layer: 'above',
      xref: 'x',
      x0: origin.x * scale.x,
      x1: origin.x * scale.x,
      yref: 'paper',
      y0: 0,
      y1: 1,
      line,
    });
  }

  if (isAtEdge(origin.y, axisRange.y)) {
    shapes.push({
      type: 'line',
      layer: 'above',
      xref: 'paper',
      x0: 0,
      x1: 1,
      yref: 'y',
      y0: origin.y * scale.y,
      y1: origin.y * scale.y,
      line,
    });
  }

  return shapes;
};
