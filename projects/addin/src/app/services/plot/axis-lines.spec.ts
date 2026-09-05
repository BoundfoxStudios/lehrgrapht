import { PlotSettings } from '../../models/plot';
import { buildAxisLines } from './axis-lines';
import type { AxisRange } from './plot-geometry';

const plotSettings: PlotSettings = {
  zeroLineWidth: 2,
  zeroLineColor: '#123456',
  gridLineWidth: 0.5,
  gridLineColor: '#cccccc',
  plotLineWidth: 1.5,
  markerNamingScheme: 'alphabetic',
  legendLabelFormat: 'none',
};

const aroundZero: AxisRange = { min: -3, max: 3 };

describe('buildAxisLines', () => {
  it('should draw nothing when the origin lies inside both ranges', () => {
    expect(
      buildAxisLines(
        { x: 0, y: 0 },
        { x: aroundZero, y: aroundZero },
        { x: 1, y: 1 },
        plotSettings,
      ),
    ).toEqual([]);
  });

  it('should draw a vertical line when the origin sits on the range minimum', () => {
    const shapes = buildAxisLines(
      { x: 0, y: 0 },
      { x: { min: 0, max: 10 }, y: aroundZero },
      { x: 0.5, y: 1 },
      plotSettings,
    );

    expect(shapes).toEqual([
      expect.objectContaining({ type: 'line', xref: 'x', x0: 0, x1: 0 }),
    ]);
  });

  it('should draw a horizontal line when the origin sits on the range maximum', () => {
    const shapes = buildAxisLines(
      { x: 0, y: 0 },
      { x: aroundZero, y: { min: -10, max: 0 } },
      { x: 1, y: 0.5 },
      plotSettings,
    );

    expect(shapes).toEqual([
      expect.objectContaining({ type: 'line', yref: 'y', y0: 0, y1: 0 }),
    ]);
  });

  it('should draw a vertical line across the plot at the scaled origin', () => {
    const [vertical] = buildAxisLines(
      { x: 9, y: 0 },
      { x: { min: 9, max: 20 }, y: aroundZero },
      { x: 0.5, y: 1 },
      plotSettings,
    );

    expect(vertical).toEqual(
      expect.objectContaining({
        type: 'line',
        layer: 'above',
        xref: 'x',
        x0: 4.5,
        x1: 4.5,
        yref: 'paper',
        y0: 0,
        y1: 1,
      }),
    );
  });

  it('should draw a horizontal line across the plot at the scaled origin', () => {
    const [horizontal] = buildAxisLines(
      { x: 0, y: -200 },
      { x: aroundZero, y: { min: -200, max: -50 } },
      { x: 1, y: 0.025 },
      plotSettings,
    );

    expect(horizontal).toEqual(
      expect.objectContaining({
        type: 'line',
        layer: 'above',
        xref: 'paper',
        x0: 0,
        x1: 1,
        yref: 'y',
        y0: -5,
        y1: -5,
      }),
    );
  });

  it('should take color and width from the plot settings', () => {
    const lines = buildAxisLines(
      { x: 9, y: -2 },
      { x: { min: 9, max: 20 }, y: { min: -10, max: -2 } },
      { x: 1, y: 1 },
      plotSettings,
    );

    expect(lines.length).toBe(2);
    for (const shape of lines) {
      expect(shape.line).toEqual({ color: '#123456', width: 2 });
    }
  });
});
