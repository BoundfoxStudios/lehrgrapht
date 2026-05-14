import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  ApplyContext,
  applyFunction,
  applyMarker,
  applyPolygon,
  applyReflectionAxis,
  applyReflectionPoint,
} from './interactive-strategy';
import { Plot } from '../../models/plot';
import { nextColor } from '../../utils/next-color';

const basePlot: Plot = {
  version: '1.0.0',
  name: 'test',
  range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
  fnx: [],
  markers: [],
  polygons: [],
  showAxis: true,
  showAxisLabels: true,
  placeAxisLabelsInside: true,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
  showAxisArrows: false,
  gridStep: '1',
  reflection: { kind: 'none' },
};

const ctx: ApplyContext = {
  scheme: 'numeric',
  markerNamingService: new MarkerNamingService(),
};

describe('applyMarker', () => {
  it('returns model unchanged with 0 points', () => {
    expect(applyMarker(basePlot, [], ctx)).toBe(basePlot);
  });

  it('appends one marker per point with names continuing from existing count', () => {
    const seed = { ...basePlot, markers: [{ x: 9, y: 9, text: 'P1' }] };
    const result = applyMarker(
      seed,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.markers.length).toBe(3);
    expect(result.markers[1].text).toBe('P2');
    expect(result.markers[2].text).toBe('P3');
  });

  it('does not mutate input', () => {
    const before = JSON.stringify(basePlot);
    applyMarker(basePlot, [{ x: 0, y: 0 }], ctx);
    expect(JSON.stringify(basePlot)).toBe(before);
  });
});

describe('applyFunction', () => {
  it('returns model unchanged with <2 points', () => {
    expect(applyFunction(basePlot, [], ctx)).toBe(basePlot);
    expect(applyFunction(basePlot, [{ x: 0, y: 0 }], ctx)).toBe(basePlot);
  });

  it('returns model unchanged for two points with same x (vertical)', () => {
    const result = applyFunction(
      basePlot,
      [
        { x: 1, y: 0 },
        { x: 1, y: 5 },
      ],
      ctx,
    );
    expect(result).toBe(basePlot);
  });

  it('appends fnx with line expression for two points', () => {
    const result = applyFunction(
      basePlot,
      [
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ],
      ctx,
    );
    expect(result.fnx.length).toBe(1);
    expect(result.fnx[0]).toEqual({
      fnx: 'x+1',
      color: nextColor(0),
      legendPosition: 'none',
      lineStyle: 'solid',
    });
  });

  it('appends fnx with parabola expression for three points', () => {
    const result = applyFunction(
      basePlot,
      [
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.fnx.length).toBe(1);
    expect(result.fnx[0]).toEqual({
      fnx: 'x^2',
      color: nextColor(0),
      legendPosition: 'none',
      lineStyle: 'solid',
    });
  });

  it('returns model unchanged for three points sharing an x', () => {
    const result = applyFunction(
      basePlot,
      [
        { x: 1, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 5 },
      ],
      ctx,
    );
    expect(result).toBe(basePlot);
  });

  it('appends a line for three collinear points', () => {
    const result = applyFunction(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ],
      ctx,
    );
    expect(result.fnx.length).toBe(1);
    expect(result.fnx[0].fnx).toBe('x');
  });

  it('cycles color based on existing fnx count', () => {
    const seed = {
      ...basePlot,
      fnx: [
        {
          fnx: 'x',
          color: nextColor(0),
          legendPosition: 'none' as const,
          lineStyle: 'solid' as const,
        },
      ],
    };
    const result = applyFunction(
      seed,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.fnx[1].color).toBe(nextColor(1));
  });
});

describe('applyPolygon', () => {
  it('returns the model unchanged when fewer than 2 points', () => {
    const result = applyPolygon(basePlot, [{ x: 0, y: 0 }], ctx);
    expect(result).toBe(basePlot);
  });

  it('appends an open 2-point polygon when given 2 points', () => {
    const result = applyPolygon(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.polygons.length).toBe(1);
    const polygon = result.polygons[0];
    expect(polygon.connect).toBe(false);
    expect(polygon.fillColor).toBe(null);
    expect(polygon.lineStyle).toBe('solid');
    expect(polygon.showPoints).toBe(false);
    expect(polygon.points).toEqual([
      { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
      { x: 1, y: 1, labelPosition: 'auto', labelText: '' },
    ]);
  });

  it('assigns colors from the palette based on the polygon index', () => {
    const r1 = applyPolygon(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(r1.polygons[0].lineColor).toBe(nextColor(0));

    const r2 = applyPolygon(
      r1,
      [
        { x: 2, y: 2 },
        { x: 3, y: 3 },
      ],
      ctx,
    );
    expect(r2.polygons[1].lineColor).toBe(nextColor(1));
  });

  it('accepts polygons with more than 2 points', () => {
    const result = applyPolygon(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ],
      ctx,
    );
    expect(result.polygons[0].points.length).toBe(3);
  });

  it('does not mutate the input model', () => {
    const before = JSON.stringify(basePlot);
    applyPolygon(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(JSON.stringify(basePlot)).toBe(before);
  });

  it('removes redundant points from the polygon it creates', () => {
    const result = applyPolygon(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
      ],
      ctx,
    );
    expect(result.polygons.length).toBe(1);
    expect(result.polygons[0].points).toEqual([
      { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
      { x: 10, y: 0, labelPosition: 'auto', labelText: '' },
      { x: 10, y: 5, labelPosition: 'auto', labelText: '' },
    ]);
  });

  it('returns the model unchanged when dedupe reduces below 2 points', () => {
    const result = applyPolygon(
      basePlot,
      [
        { x: 3, y: 3 },
        { x: 3, y: 3 },
      ],
      ctx,
    );
    expect(result).toBe(basePlot);
  });
});

describe('applyReflectionPoint', () => {
  it('sets reflection.kind to "point" with the click coordinates and isSolution=false', () => {
    const result = applyReflectionPoint(basePlot, [{ x: 1, y: 2 }], ctx);
    expect(result.reflection).toEqual({
      kind: 'point',
      point: { x: 1, y: 2 },
      isSolution: false,
    });
  });

  it('overwrites an existing reflection.kind="axis" and preserves isSolution', () => {
    const plot: Plot = {
      ...basePlot,
      reflection: {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        isSolution: true,
        color: '#ff0000',
        lineStyle: 'solid',
        extendBeyondPoints: false,
      },
    };
    const result = applyReflectionPoint(plot, [{ x: 5, y: 5 }], ctx);
    expect(result.reflection).toEqual({
      kind: 'point',
      point: { x: 5, y: 5 },
      isSolution: true,
    });
  });

  it('returns model unchanged when no points are provided', () => {
    expect(applyReflectionPoint(basePlot, [], ctx)).toBe(basePlot);
  });
});

describe('applyReflectionAxis', () => {
  it('sets reflection.kind to "axis" with the two click coordinates and isSolution=false', () => {
    const result = applyReflectionAxis(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
      ctx,
    );
    expect(result.reflection).toEqual({
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 5, y: 5 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    });
  });

  it('preserves isSolution from an existing reflection.kind="point"', () => {
    const plot: Plot = {
      ...basePlot,
      reflection: {
        kind: 'point',
        point: { x: 0, y: 0 },
        isSolution: true,
      },
    };
    const result = applyReflectionAxis(
      plot,
      [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
      ctx,
    );
    expect(result.reflection).toEqual({
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 5, y: 5 } },
      isSolution: true,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    });
  });

  it('preserves the existing axis style when overwriting an axis reflection', () => {
    const plot: Plot = {
      ...basePlot,
      reflection: {
        kind: 'axis',
        axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        isSolution: false,
        color: '#00ff00',
        lineStyle: 'dashed',
        extendBeyondPoints: true,
      },
    };
    const result = applyReflectionAxis(
      plot,
      [
        { x: 2, y: 0 },
        { x: 5, y: 5 },
      ],
      ctx,
    );
    expect(result.reflection).toEqual({
      kind: 'axis',
      axis: { p1: { x: 2, y: 0 }, p2: { x: 5, y: 5 } },
      isSolution: false,
      color: '#00ff00',
      lineStyle: 'dashed',
      extendBeyondPoints: true,
    });
  });

  it('returns model unchanged when the two points are identical', () => {
    const result = applyReflectionAxis(
      basePlot,
      [
        { x: 3, y: 3 },
        { x: 3, y: 3 },
      ],
      ctx,
    );
    expect(result).toBe(basePlot);
  });

  it('returns model unchanged when fewer than 2 points are provided', () => {
    expect(applyReflectionAxis(basePlot, [{ x: 1, y: 2 }], ctx)).toBe(basePlot);
  });
});
