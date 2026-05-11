import { Plot } from '../../models/plot';
import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  applyMarker,
  applyPolygon,
  applyStraightLine,
  ApplyContext,
  calculateStraightLineFunction,
  namePolygonPoints,
  nextColor,
  removeAt,
  shiftIndicesAfterRemove,
} from './plot-editor.store';

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
};

const ctx: ApplyContext = {
  scheme: 'numeric',
  markerNamingService: new MarkerNamingService(),
};

describe('nextColor', () => {
  it('returns palette color for index within range', () => {
    expect(typeof nextColor(0)).toBe('string');
    expect(nextColor(0).startsWith('#')).toBe(true);
  });

  it('wraps modulo palette length', () => {
    expect(nextColor(0)).toBe(nextColor(4));
    expect(nextColor(1)).toBe(nextColor(5));
    expect(nextColor(2)).toBe(nextColor(6));
    expect(nextColor(3)).toBe(nextColor(7));
  });

  it('produces 4 distinct colors for 0..3', () => {
    const distinct = new Set([
      nextColor(0),
      nextColor(1),
      nextColor(2),
      nextColor(3),
    ]);
    expect(distinct.size).toBe(4);
  });
});

describe('removeAt', () => {
  it('removes element at given index', () => {
    expect(removeAt([1, 2, 3, 4], 1)).toEqual([1, 3, 4]);
  });

  it('handles first index', () => {
    expect(removeAt([1, 2, 3], 0)).toEqual([2, 3]);
  });

  it('handles last index', () => {
    expect(removeAt([1, 2, 3], 2)).toEqual([1, 2]);
  });

  it('returns a new array, leaves input untouched', () => {
    const input = [1, 2, 3];
    const result = removeAt(input, 1);
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('namePolygonPoints', () => {
  const namer = new MarkerNamingService();

  it('maps each point to a labeled PolygonPoint with auto labelPosition', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    const result = namePolygonPoints(points, 'numeric', namer, 0);
    expect(result).toEqual([
      { x: 0, y: 0, labelPosition: 'auto', labelText: 'P1' },
      { x: 1, y: 1, labelPosition: 'auto', labelText: 'P2' },
    ]);
  });

  it('starts naming at startIndex', () => {
    const points = [{ x: 0, y: 0 }];
    const result = namePolygonPoints(points, 'numeric', namer, 4);
    expect(result[0].labelText).toBe('P5');
  });

  it('respects scheme', () => {
    const points = [{ x: 0, y: 0 }];
    expect(namePolygonPoints(points, 'alphabetic', namer, 0)[0].labelText).toBe(
      'A',
    );
    expect(namePolygonPoints(points, 'numeric', namer, 0)[0].labelText).toBe(
      'P1',
    );
  });
});

describe('calculateStraightLineFunction', () => {
  it('returns null for vertical line', () => {
    expect(
      calculateStraightLineFunction({ x: 1, y: 0 }, { x: 1, y: 5 }),
    ).toBeNull();
  });

  it('handles horizontal line (m === 0)', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 3 }, { x: 5, y: 3 })).toBe(
      '3',
    );
  });

  it('handles slope 1 with intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 1 }, { x: 1, y: 2 })).toBe(
      'x+1',
    );
  });

  it('handles slope -1 with no intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 0 }, { x: 1, y: -1 })).toBe(
      '-x',
    );
  });

  it('handles generic slope and negative intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: -2 }, { x: 1, y: 0 })).toBe(
      '2*x-2',
    );
  });
});

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

describe('applyStraightLine', () => {
  it('returns model unchanged with <2 points', () => {
    expect(applyStraightLine(basePlot, [], ctx)).toBe(basePlot);
    expect(applyStraightLine(basePlot, [{ x: 0, y: 0 }], ctx)).toBe(basePlot);
  });

  it('returns model unchanged for vertical line (calculateStraightLineFunction returns null)', () => {
    const result = applyStraightLine(
      basePlot,
      [
        { x: 1, y: 0 },
        { x: 1, y: 5 },
      ],
      ctx,
    );
    expect(result).toBe(basePlot);
  });

  it('appends fnx with computed expression, cycled color, none legend', () => {
    const result = applyStraightLine(
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
});

describe('shiftIndicesAfterRemove', () => {
  it('drops the removed index', () => {
    expect(shiftIndicesAfterRemove([0, 1, 2], 1)).toEqual([0, 1]);
  });

  it('shifts indices greater than removedIndex down by one', () => {
    expect(shiftIndicesAfterRemove([2, 3, 5], 1)).toEqual([1, 2, 4]);
  });

  it('keeps indices less than removedIndex untouched', () => {
    expect(shiftIndicesAfterRemove([0, 1, 4], 3)).toEqual([0, 1, 3]);
    // index 4 -> 3; nothing else moves
    expect(shiftIndicesAfterRemove([0, 1, 4], 2)).toEqual([0, 1, 3]);
  });

  it('returns empty array when input is empty', () => {
    expect(shiftIndicesAfterRemove([], 0)).toEqual([]);
  });

  it('handles unordered input (preserves order, not sortedness)', () => {
    expect(shiftIndicesAfterRemove([3, 0, 5, 1], 2)).toEqual([2, 0, 4, 1]);
  });

  it('returns a new array, leaves input untouched', () => {
    const input = [0, 2, 3];
    const result = shiftIndicesAfterRemove(input, 1);
    expect(result).not.toBe(input);
    expect(input).toEqual([0, 2, 3]);
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
});
