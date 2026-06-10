import { isPolygonClosingClick, karopapierPlot } from './plot-editor.store';
import { InteractiveMode } from './interactive-mode';
import { dedupePolygonPoints } from './interactive-strategy';

describe('karopapierPlot', () => {
  it('switches every Darstellung toggle off', () => {
    const plot = karopapierPlot();

    expect(plot.showAxis).toBe(false);
    expect(plot.showAxisLabels).toBe(false);
    expect(plot.showAxisArrows).toBe(false);
    expect(plot.placeAxisLabelsInside).toBe(false);
    expect(plot.legendLabelFormat).toBe('none');
  });

  it('names the plot Karopapier', () => {
    expect(karopapierPlot().name).toBe('Karopapier');
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

  it('removes a collinear middle point on a segment', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('removes all collinear middles on a shared axis', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('keeps a zigzag point (collinear but outside the segment)', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
    ];
    expect(dedupePolygonPoints(input)).toEqual(input);
  });

  it('combines duplicate and collinear removal in the correct order', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('returns a single point when input contains only one point', () => {
    expect(dedupePolygonPoints([{ x: 3, y: 3 }])).toEqual([{ x: 3, y: 3 }]);
  });

  it('returns a single point when all points are duplicates', () => {
    expect(
      dedupePolygonPoints([
        { x: 3, y: 3 },
        { x: 3, y: 3 },
      ]),
    ).toEqual([{ x: 3, y: 3 }]);
  });

  it('returns an empty array for empty input', () => {
    expect(dedupePolygonPoints([])).toEqual([]);
  });
});
