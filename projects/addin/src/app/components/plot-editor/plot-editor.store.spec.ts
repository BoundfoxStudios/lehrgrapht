import { Plot } from '../../models/plot';
import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  applyArea,
  ApplyContext,
  calculateStraightLineFunction,
  nameAreaPoints,
  nextColor,
  removeAt,
} from './plot-editor.store';

const basePlot: Plot = {
  version: '1.0.0',
  name: 'test',
  range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
  fnx: [],
  markers: [],
  areas: [],
  lines: [],
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

describe('nameAreaPoints', () => {
  const namer = new MarkerNamingService();

  it('maps each point to a labeled AreaPoint with auto labelPosition', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ];
    const result = nameAreaPoints(points, 'numeric', namer, 0);
    expect(result).toEqual([
      { x: 0, y: 0, labelPosition: 'auto', labelText: 'P1' },
      { x: 1, y: 1, labelPosition: 'auto', labelText: 'P2' },
    ]);
  });

  it('starts naming at startIndex', () => {
    const points = [{ x: 0, y: 0 }];
    const result = nameAreaPoints(points, 'numeric', namer, 4);
    expect(result[0].labelText).toBe('P5');
  });

  it('respects scheme', () => {
    const points = [{ x: 0, y: 0 }];
    expect(nameAreaPoints(points, 'alphabetic', namer, 0)[0].labelText).toBe(
      'A',
    );
    expect(nameAreaPoints(points, 'numeric', namer, 0)[0].labelText).toBe('P1');
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

describe('applyArea', () => {
  it('returns model unchanged with 0 points', () => {
    const result = applyArea(basePlot, [], ctx);
    expect(result).toBe(basePlot);
  });

  it('appends one area with labeled points (preview path with 2 points)', () => {
    const result = applyArea(
      basePlot,
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      ctx,
    );
    expect(result.areas.length).toBe(1);
    expect(result.areas[0].points.map(p => p.labelText)).toEqual(['P1', 'P2']);
    expect(result.areas[0].showPoints).toBe(false);
  });

  it('cycles color based on existing area count', () => {
    const oneArea = {
      ...basePlot,
      areas: [{ points: [], color: '#000', showPoints: false }],
    };
    const result = applyArea(oneArea, [{ x: 0, y: 0 }], ctx);
    expect(result.areas[1].color).toBe(nextColor(1));
  });

  it('continues label index from existing labeled points', () => {
    const seed: Plot = {
      ...basePlot,
      areas: [
        {
          points: [
            { x: 0, y: 0, labelPosition: 'auto', labelText: 'P1' },
            { x: 1, y: 0, labelPosition: 'auto', labelText: 'P2' },
          ],
          color: '#000',
          showPoints: true,
        },
      ],
    };
    const result = applyArea(seed, [{ x: 2, y: 0 }], ctx);
    expect(result.areas[1].points[0].labelText).toBe('P3');
  });

  it('does not mutate the input model', () => {
    const before = JSON.stringify(basePlot);
    applyArea(basePlot, [{ x: 0, y: 0 }], ctx);
    expect(JSON.stringify(basePlot)).toBe(before);
  });
});
