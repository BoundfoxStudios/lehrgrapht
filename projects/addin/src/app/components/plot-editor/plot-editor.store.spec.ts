import { Plot, Polygon } from '../../models/plot';
import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  applyAutoLabelToPolygon,
  applyFunction,
  applyMarker,
  applyPolygon,
  ApplyContext,
  calculateParabolaFunction,
  calculateStraightLineFunction,
  dedupePolygonPoints,
  isPolygonClosingClick,
  namePolygonPoints,
  nextColor,
  removeAt,
  shiftIndicesAfterRemove,
} from './plot-editor.store';
import { InteractiveMode } from './interactive-mode';

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

describe('applyAutoLabelToPolygon', () => {
  const namer = new MarkerNamingService();

  const polygonWithEmptyLabels = (): Polygon => ({
    points: [
      { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
      { x: 1, y: 1, labelPosition: 'top right', labelText: '' },
      { x: 2, y: 2, labelPosition: 'auto', labelText: '   ' },
    ],
    connect: true,
    lineColor: '#000',
    fillColor: null,
    lineStyle: 'solid',
    showPoints: true,
    fillStyle: 'solid',
  });

  it('labels all points when none have a label', () => {
    const result = applyAutoLabelToPolygon(
      polygonWithEmptyLabels(),
      'alphabetic',
      namer,
      0,
    );
    expect(result.points.map(p => p.labelText)).toEqual(['A', 'B', 'C']);
  });

  it('preserves labelPosition of each point', () => {
    const result = applyAutoLabelToPolygon(
      polygonWithEmptyLabels(),
      'alphabetic',
      namer,
      0,
    );
    expect(result.points.map(p => p.labelPosition)).toEqual([
      'auto',
      'top right',
      'auto',
    ]);
  });

  it('returns the polygon unchanged when at least one point already has a non-empty label', () => {
    const polygon = polygonWithEmptyLabels();
    polygon.points[1] = { ...polygon.points[1], labelText: 'X' };
    const result = applyAutoLabelToPolygon(polygon, 'alphabetic', namer, 0);
    expect(result).toBe(polygon);
  });

  it('treats whitespace-only labels as empty', () => {
    const polygon = polygonWithEmptyLabels();
    polygon.points[0] = { ...polygon.points[0], labelText: '  ' };
    const result = applyAutoLabelToPolygon(polygon, 'alphabetic', namer, 0);
    expect(result.points.map(p => p.labelText)).toEqual(['A', 'B', 'C']);
  });

  it('applies startIndex offset and respects the numeric scheme', () => {
    const result = applyAutoLabelToPolygon(
      polygonWithEmptyLabels(),
      'numeric',
      namer,
      3,
    );
    expect(result.points.map(p => p.labelText)).toEqual(['P4', 'P5', 'P6']);
  });

  it('does not mutate the input polygon', () => {
    const polygon = polygonWithEmptyLabels();
    const before = JSON.stringify(polygon);
    applyAutoLabelToPolygon(polygon, 'alphabetic', namer, 0);
    expect(JSON.stringify(polygon)).toBe(before);
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

describe('calculateParabolaFunction', () => {
  it('returns null when two points share the same x', () => {
    expect(
      calculateParabolaFunction({ x: 1, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 5 }),
    ).toBeNull();
  });

  it('returns null when all three points share the same x', () => {
    expect(
      calculateParabolaFunction({ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }),
    ).toBeNull();
  });

  it('returns "x^2" for the unit parabola through (-1,1), (0,0), (1,1)', () => {
    expect(
      calculateParabolaFunction(
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ),
    ).toBe('x^2');
  });

  it('returns "-x^2" for the inverted unit parabola', () => {
    expect(
      calculateParabolaFunction(
        { x: -1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
      ),
    ).toBe('-x^2');
  });

  it('formats general quadratic with all coefficients', () => {
    // y = 2x^2 - 4x + 3 through (0,3), (1,1), (2,3)
    expect(
      calculateParabolaFunction({ x: 0, y: 3 }, { x: 1, y: 1 }, { x: 2, y: 3 }),
    ).toBe('2*x^2-4*x+3');
  });

  it('omits the b-term when b rounds to 0', () => {
    // y = x^2 + 1 through (-1,2), (0,1), (1,2)
    expect(
      calculateParabolaFunction(
        { x: -1, y: 2 },
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ),
    ).toBe('x^2+1');
  });

  it('omits the c-term when c rounds to 0', () => {
    // y = x^2 + x through (-1,0), (0,0), (1,2)
    expect(
      calculateParabolaFunction(
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 2 },
      ),
    ).toBe('x^2+x');
  });

  it('falls back to a line when three points are collinear (a rounds to 0)', () => {
    // y = x through (0,0), (1,1), (2,2)
    expect(
      calculateParabolaFunction({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }),
    ).toBe('x');
  });

  it('returns constant string when all three y are equal', () => {
    expect(
      calculateParabolaFunction(
        { x: -1, y: 4 },
        { x: 0, y: 4 },
        { x: 1, y: 4 },
      ),
    ).toBe('4');
  });

  it('handles negative intercept', () => {
    // y = x^2 - 2 through (-1,-1), (0,-2), (1,-1)
    expect(
      calculateParabolaFunction(
        { x: -1, y: -1 },
        { x: 0, y: -2 },
        { x: 1, y: -1 },
      ),
    ).toBe('x^2-2');
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

describe('isPolygonClosingClick', () => {
  it('returns false when mode is not Polygon', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Marker,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        { x: 0, y: 0 },
      ),
    ).toBe(false);
  });

  it('returns false when fewer than 3 points have been placed', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        { x: 0, y: 0 },
      ),
    ).toBe(false);
  });

  it('returns false when there are no points yet', () => {
    expect(
      isPolygonClosingClick(InteractiveMode.Polygon, [], { x: 0, y: 0 }),
    ).toBe(false);
  });

  it('returns false when the click does not match the start point', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        { x: 1, y: 1 },
      ),
    ).toBe(false);
  });

  it('returns true when 3 points placed and click matches the start point', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        { x: 0.5, y: 0.5 },
      ),
    ).toBe(true);
  });

  it('returns true when more than 3 points placed and click matches the start point', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0.5, y: 1.5 },
          { x: 0, y: 1 },
        ],
        { x: 0, y: 0 },
      ),
    ).toBe(true);
  });
});

describe('dedupePolygonPoints', () => {
  it('returns input unchanged when there is no redundancy', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 5 },
    ];
    expect(dedupePolygonPoints(input)).toEqual(input);
  });

  it('removes a consecutive duplicate', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });

  it('removes multiple consecutive duplicates in a row', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });

  it('keeps non-consecutive duplicates (self-intersection)', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 5 },
    ];
    expect(dedupePolygonPoints(input)).toEqual(input);
  });
});
