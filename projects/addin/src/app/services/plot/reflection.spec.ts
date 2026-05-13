import { Reflection } from '../../models/plot';
import { PlotRange } from '../../models/plot-range';
import {
  computeAxisLineEndpoints,
  reflectPoint,
  reflectPolygonPoints,
} from './reflection';

describe('reflectPoint', () => {
  it('returns input unchanged for kind="none"', () => {
    const r: Reflection = { kind: 'none' };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: 4 });
  });

  it('reflects through origin point', () => {
    const r: Reflection = {
      kind: 'point',
      point: { x: 0, y: 0 },
      isSolution: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: -3, y: -4 });
  });

  it('reflects through arbitrary point', () => {
    const r: Reflection = {
      kind: 'point',
      point: { x: 1, y: 2 },
      isSolution: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: -1, y: 0 });
  });

  it('reflects across x-axis (y=0)', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: -4 });
  });

  it('reflects across y-axis (x=0)', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: -3, y: 4 });
  });

  it('reflects across y=x diagonal', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 4, y: 3 });
  });

  it('keeps a point that lies on the axis', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 1 }, p2: { x: 1, y: 2 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: 4 });
  });

  it('reflects across y=x+1 for an off-axis point', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 1 }, p2: { x: 1, y: 2 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    expect(reflectPoint({ x: 0, y: 0 }, r)).toEqual({ x: -1, y: 1 });
  });

  it('returns input unchanged for degenerate axis (p1 === p2)', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 1, y: 1 }, p2: { x: 1, y: 1 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: 4 });
  });
});

describe('reflectPolygonPoints', () => {
  it('reflects each point and preserves labelPosition + labelText', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
      isSolution: false,
      color: '#ff0000',
      lineStyle: 'solid',
      extendBeyondPoints: false,
    };
    const result = reflectPolygonPoints(
      [
        { x: 1, y: 2, labelPosition: 'top right', labelText: 'A' },
        { x: 3, y: 4, labelPosition: 'auto', labelText: '' },
      ],
      r,
    );
    expect(result).toEqual([
      { x: 1, y: -2, labelPosition: 'top right', labelText: 'A' },
      { x: 3, y: -4, labelPosition: 'auto', labelText: '' },
    ]);
  });

  it('returns identity points for kind="none"', () => {
    const r: Reflection = { kind: 'none' };
    const input = [
      { x: 1, y: 2, labelPosition: 'top right' as const, labelText: 'A' },
    ];
    expect(reflectPolygonPoints(input, r)).toEqual(input);
  });
});

describe('computeAxisLineEndpoints', () => {
  const range: PlotRange = {
    x: { min: -5, max: 5 },
    y: { min: -5, max: 5 },
  };

  it('returns top/bottom endpoints for a vertical axis within range', () => {
    const result = computeAxisLineEndpoints(
      { p1: { x: 2, y: 0 }, p2: { x: 2, y: 1 } },
      range,
    );
    expect(result).toEqual([
      { x: 2, y: -5 },
      { x: 2, y: 5 },
    ]);
  });

  it('returns null for a vertical axis outside the range', () => {
    expect(
      computeAxisLineEndpoints(
        { p1: { x: 10, y: 0 }, p2: { x: 10, y: 1 } },
        range,
      ),
    ).toBeNull();
  });

  it('returns left/right endpoints for a horizontal axis within range', () => {
    const result = computeAxisLineEndpoints(
      { p1: { x: 0, y: 2 }, p2: { x: 1, y: 2 } },
      range,
    );
    expect(result).toEqual([
      { x: -5, y: 2 },
      { x: 5, y: 2 },
    ]);
  });

  it('returns null for a horizontal axis outside the range', () => {
    expect(
      computeAxisLineEndpoints(
        { p1: { x: 0, y: 10 }, p2: { x: 1, y: 10 } },
        range,
      ),
    ).toBeNull();
  });

  it('returns two corner-cut endpoints for the diagonal y=x', () => {
    const result = computeAxisLineEndpoints(
      { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      range,
    );
    expect(result).toEqual([
      { x: -5, y: -5 },
      { x: 5, y: 5 },
    ]);
  });

  it('returns null for a diagonal that does not intersect the range', () => {
    const tinyRange: PlotRange = {
      x: { min: 0, max: 1 },
      y: { min: 0, max: 1 },
    };
    expect(
      computeAxisLineEndpoints(
        { p1: { x: 10, y: 0 }, p2: { x: 10, y: 1 } },
        tinyRange,
      ),
    ).toBeNull();
  });

  it('returns null for a degenerate axis (p1 === p2)', () => {
    expect(
      computeAxisLineEndpoints(
        { p1: { x: 1, y: 1 }, p2: { x: 1, y: 1 } },
        range,
      ),
    ).toBeNull();
  });
});
