import type { Plot, UnitsPerSquare } from '../../models/plot';
import {
  buildAxisTicks,
  formatAxisValue,
  gridMultipliers,
  renderScale,
  squareCounts,
} from './plot-geometry';

const plotWithUnitsPerSquare = (
  unitsPerSquare: Partial<UnitsPerSquare> | undefined,
): Plot => ({ unitsPerSquare }) as Plot;

const defaultUnitsPerSquare: UnitsPerSquare = { x: 0.5, y: 0.5 };

describe('squareCounts', () => {
  it('should count each axis from its own range when square plots are off', () => {
    expect(squareCounts(4, 10, defaultUnitsPerSquare, false)).toEqual({
      x: 8,
      y: 20,
    });
  });

  it('should count both axes from the larger range when square plots are on', () => {
    expect(squareCounts(4, 10, defaultUnitsPerSquare, true)).toEqual({
      x: 20,
      y: 20,
    });
  });

  it('should turn a range of six units into twelve squares', () => {
    expect(squareCounts(6, 6, defaultUnitsPerSquare, false)).toEqual({
      x: 12,
      y: 12,
    });
  });

  it('should count each axis with its own units per square', () => {
    expect(squareCounts(11, 200, { x: 1, y: 20 }, false)).toEqual({
      x: 11,
      y: 10,
    });
  });

  it('should level the square counts instead of the ranges when square plots are on', () => {
    expect(squareCounts(11, 200, { x: 1, y: 20 }, true)).toEqual({
      x: 11,
      y: 11,
    });
  });

  it('should fall back to the default scale when units per square are missing', () => {
    expect(
      squareCounts(4, 10, undefined as unknown as UnitsPerSquare, false),
    ).toEqual({ x: 8, y: 20 });
  });
});

describe('renderScale', () => {
  it('should keep the factor at one for the default of half a unit per square', () => {
    expect(renderScale(plotWithUnitsPerSquare({ x: 0.5, y: 0.5 }))).toEqual({
      x: 1,
      y: 1,
    });
  });

  it('should scale both axes independently when their units per square differ', () => {
    expect(renderScale(plotWithUnitsPerSquare({ x: 1, y: 20 }))).toEqual({
      x: 0.5,
      y: 0.025,
    });
  });

  it('should keep the factor at one when units per square are missing entirely', () => {
    expect(renderScale(plotWithUnitsPerSquare(undefined))).toEqual({
      x: 1,
      y: 1,
    });
  });

  it('should fall back only for the axis whose value is missing', () => {
    expect(renderScale(plotWithUnitsPerSquare({ x: 1 }))).toEqual({
      x: 0.5,
      y: 1,
    });
  });

  it('should keep the factor at one for values that are not a number', () => {
    expect(renderScale(plotWithUnitsPerSquare({ x: NaN, y: NaN }))).toEqual({
      x: 1,
      y: 1,
    });
  });

  it('should keep the factor at one for zero and negative values', () => {
    expect(renderScale(plotWithUnitsPerSquare({ x: 0, y: -2 }))).toEqual({
      x: 1,
      y: 1,
    });
  });
});

describe('gridMultipliers', () => {
  it('should anchor the multiples at zero instead of at the range start', () => {
    expect(gridMultipliers(1.5, 7.5, 1)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('should keep a bound that misses the grid only by floating point noise', () => {
    expect(gridMultipliers(-3, 2.9999999999999996, 0.5).at(-1)).toBe(6);
  });

  it('should return nothing for a step that cannot span a grid', () => {
    expect(gridMultipliers(-3, 3, 0)).toEqual([]);
    expect(gridMultipliers(-3, 3, -1)).toEqual([]);
    expect(gridMultipliers(-3, 3, NaN)).toEqual([]);
  });
});

describe('formatAxisValue', () => {
  it('should drop the floating point noise of a non-dyadic step', () => {
    expect(formatAxisValue(0.1 + 0.2)).toBe('0.3');
  });

  it('should write a negative value with the typographic minus sign', () => {
    expect(formatAxisValue(-2.5)).toBe('\u22122.5');
  });

  it('should leave the minus of an exponent alone', () => {
    expect(formatAxisValue(1e-21)).toBe('1e-21');
  });
});

describe('buildAxisTicks', () => {
  it('should place a tick on every grid line and a label on every second one', () => {
    expect(buildAxisTicks(-3, 3, 0.5, 1)).toEqual({
      tickvals: [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3],
      ticktext: [
        '\u22123',
        '',
        '\u22122',
        '',
        '\u22121',
        '',
        '0',
        '',
        '1',
        '',
        '2',
        '',
        '3',
      ],
    });
  });

  it('should hit the zero line exactly so that Plotly suppresses its grid line', () => {
    const { tickvals } = buildAxisTicks(-3, 3, 0.5, 1);

    expect(Object.is(tickvals[tickvals.indexOf(0)], 0)).toBe(true);
  });

  it('should position the ticks in render space and label them in data space', () => {
    expect(buildAxisTicks(0, 200, 20, 0.025)).toEqual({
      tickvals: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
      ticktext: ['0', '', '40', '', '80', '', '120', '', '160', '', '200'],
    });
  });

  it('should keep the label on the even multiples when the range starts on an odd one', () => {
    expect(buildAxisTicks(-1.5, 1.5, 1, 1).ticktext).toEqual(['', '0', '']);
  });

  it('should keep the ticks inside bounds that miss the grid', () => {
    expect(buildAxisTicks(-2.3, 2.3, 1, 1)).toEqual({
      tickvals: [-2, -1, 0, 1, 2],
      ticktext: ['\u22122', '', '0', '', '2'],
    });
  });

  it('should label a non-dyadic step without floating point noise', () => {
    const { tickvals, ticktext } = buildAxisTicks(-1, 1, 0.15, 1);

    expect(ticktext.length).toBe(tickvals.length);
    expect(ticktext.filter(text => text !== '')).toEqual([
      '\u22120.9',
      '\u22120.6',
      '\u22120.3',
      '0',
      '0.3',
      '0.6',
      '0.9',
    ]);
  });

  it('should keep a single tick for a range without extent', () => {
    expect(buildAxisTicks(5, 5, 1, 2)).toEqual({
      tickvals: [10],
      ticktext: ['5'],
    });
  });

  it('should return no ticks for a step that cannot span a grid', () => {
    expect(buildAxisTicks(-3, 3, 0, 1)).toEqual({ tickvals: [], ticktext: [] });
    expect(buildAxisTicks(5, 5, NaN, 1)).toEqual({
      tickvals: [],
      ticktext: [],
    });
  });
});
