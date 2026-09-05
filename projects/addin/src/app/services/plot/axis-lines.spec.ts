import { PlotSettings } from '../../models/plot';
import { buildAxisLines } from './axis-lines';

const plotSettings: PlotSettings = {
  zeroLineWidth: 2,
  zeroLineColor: '#123456',
  gridLineWidth: 0.5,
  gridLineColor: '#cccccc',
  plotLineWidth: 1.5,
  markerNamingScheme: 'alphabetic',
  legendLabelFormat: 'none',
};

describe('buildAxisLines', () => {
  it('should draw nothing when both ranges contain zero', () => {
    expect(
      buildAxisLines({ x: 0, y: 0 }, { x: 1, y: 1 }, plotSettings),
    ).toEqual([]);
  });

  it('should draw a vertical line across the plot at the scaled origin', () => {
    const [vertical] = buildAxisLines(
      { x: 9, y: 0 },
      { x: 0.5, y: 1 },
      plotSettings,
    );

    expect(vertical).toEqual(
      expect.objectContaining({
        type: 'line',
        layer: 'below',
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
      { x: 1, y: 0.025 },
      plotSettings,
    );

    expect(horizontal).toEqual(
      expect.objectContaining({
        type: 'line',
        layer: 'below',
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
    const lines = buildAxisLines({ x: 9, y: -2 }, { x: 1, y: 1 }, plotSettings);

    expect(lines.length).toBe(2);
    for (const shape of lines) {
      expect(shape.line).toEqual({ color: '#123456', width: 2 });
    }
  });
});
