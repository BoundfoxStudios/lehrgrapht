import type {
  AxisSnapping,
  GridStep,
  Plot,
  UnitsPerSquare,
} from '../../models/plot';
import {
  axisOrigin,
  AxisRange,
  buildAxisTicks,
  drawnAxisRange,
  formatAxisValue,
  gridMultipliers,
  renderScale,
  snapRangesToGrid,
  snapToSquare,
  squareCounts,
} from './plot-geometry';

const plotWithUnitsPerSquare = (
  unitsPerSquare: Partial<UnitsPerSquare> | undefined,
): Plot => ({ unitsPerSquare }) as Plot;

const defaultUnitsPerSquare: UnitsPerSquare = { x: 0.5, y: 0.5 };

const snappedAxis = (
  range: AxisRange,
  unitsPerSquare: number,
  gridStep: GridStep,
  snapping: AxisSnapping = 'extend',
): AxisRange =>
  snapRangesToGrid({
    x: range,
    y: range,
    unitsPerSquare: { x: unitsPerSquare, y: unitsPerSquare },
    gridStep,
    axisSnapping: { x: snapping, y: snapping },
  }).x;

describe('snapRangesToGrid', () => {
  it('should widen both bounds to the enclosing grid lines when the axis extends', () => {
    expect(snappedAxis({ min: -8, max: 10 }, 1.5, '0.5')).toEqual({
      min: -9,
      max: 10.5,
    });
  });

  it('should narrow both bounds to the enclosed grid lines when the axis shrinks', () => {
    expect(snappedAxis({ min: -8, max: 10 }, 1.5, '0.5', 'shrink')).toEqual({
      min: -7.5,
      max: 9,
    });
  });

  it('should leave bounds that already sit on a grid line', () => {
    expect(
      snapRangesToGrid({
        x: { min: 9, max: 20 },
        y: { min: 0, max: 200 },
        unitsPerSquare: { x: 1, y: 20 },
        gridStep: '0.5',
        axisSnapping: { x: 'extend', y: 'extend' },
      }),
    ).toEqual({ x: { min: 9, max: 20 }, y: { min: 0, max: 200 } });
  });

  it('should snap to every second square when a grid line is drawn only there', () => {
    expect(snappedAxis({ min: 9, max: 20 }, 1, '1')).toEqual({
      min: 8,
      max: 20,
    });
  });

  it('should keep one grid interval when shrinking would leave none', () => {
    expect(snappedAxis({ min: 1, max: 2 }, 1.5, '1', 'shrink')).toEqual({
      min: 3,
      max: 6,
    });
  });

  it('should snap each axis with its own scale and snapping mode', () => {
    expect(
      snapRangesToGrid({
        x: { min: -8, max: 10 },
        y: { min: 10, max: 150 },
        unitsPerSquare: { x: 1.5, y: 20 },
        gridStep: '0.5',
        axisSnapping: { x: 'extend', y: 'shrink' },
      }),
    ).toEqual({ x: { min: -9, max: 10.5 }, y: { min: 20, max: 140 } });
  });

  it('should extend outwards when the snapping mode is missing', () => {
    expect(
      snapRangesToGrid({
        x: { min: -8, max: 10 },
        y: { min: -8, max: 10 },
        unitsPerSquare: { x: 1.5, y: 1.5 },
        gridStep: '0.5',
        axisSnapping: undefined,
      }).x,
    ).toEqual({ min: -9, max: 10.5 });
  });

  it('should fall back to the default scale when units per square are missing', () => {
    expect(
      snapRangesToGrid({
        x: { min: -1.2, max: 1.2 },
        y: { min: -1.2, max: 1.2 },
        unitsPerSquare: undefined,
        gridStep: '0.5',
        axisSnapping: { x: 'extend', y: 'extend' },
      }).x,
    ).toEqual({ min: -1.5, max: 1.5 });
  });

  it('should keep bounds that miss their grid line only by floating point noise', () => {
    expect(snappedAxis({ min: 1.2, max: 2.4 }, 0.1, '0.5')).toEqual({
      min: 1.2,
      max: 2.4,
    });
  });

  it('should land on a grid line without floating point noise', () => {
    expect(snappedAxis({ min: 0, max: 0.25 }, 0.1, '0.5')).toEqual({
      min: 0,
      max: 0.3,
    });
  });
});

describe('squareCounts', () => {
  it('should count each axis from its own range when square plots are off', () => {
    expect(
      squareCounts({
        x: { min: -2, max: 2 },
        y: { min: -5, max: 5 },
        unitsPerSquare: defaultUnitsPerSquare,
        squarePlots: false,
      }),
    ).toEqual({ x: 8, y: 20 });
  });

  it('should count both axes from the larger range when square plots are on', () => {
    expect(
      squareCounts({
        x: { min: -2, max: 2 },
        y: { min: -5, max: 5 },
        unitsPerSquare: defaultUnitsPerSquare,
        squarePlots: true,
      }),
    ).toEqual({ x: 20, y: 20 });
  });

  it('should count each axis with its own units per square', () => {
    expect(
      squareCounts({
        x: { min: 9, max: 20 },
        y: { min: 0, max: 200 },
        unitsPerSquare: { x: 1, y: 20 },
        squarePlots: false,
      }),
    ).toEqual({ x: 11, y: 10 });
  });

  it('should level the square counts instead of the ranges when square plots are on', () => {
    expect(
      squareCounts({
        x: { min: 9, max: 20 },
        y: { min: 0, max: 200 },
        unitsPerSquare: { x: 1, y: 20 },
        squarePlots: true,
      }),
    ).toEqual({ x: 11, y: 11 });
  });

  it('should fall back to the default scale when units per square are missing', () => {
    expect(
      squareCounts({
        x: { min: -2, max: 2 },
        y: { min: -5, max: 5 },
        unitsPerSquare: undefined,
        squarePlots: false,
      }),
    ).toEqual({ x: 8, y: 20 });
  });

  it('should count a range that divides into whole squares only up to floating point noise', () => {
    expect(
      squareCounts({
        x: { min: 0, max: 0.3 },
        y: { min: -9, max: 10.5 },
        unitsPerSquare: { x: 0.1, y: 1.5 },
        squarePlots: false,
      }),
    ).toEqual({ x: 3, y: 13 });
  });
});

describe('drawnAxisRange', () => {
  it('should keep the minimum and move the maximum to the last whole square', () => {
    expect(drawnAxisRange(0, 8, 20)).toEqual({ min: 0, max: 160 });
    expect(drawnAxisRange(0, 7, 20)).toEqual({ min: 0, max: 140 });
  });

  it('should end a non-dyadic scale without floating point noise', () => {
    expect(drawnAxisRange(-3, 8, 0.8)).toEqual({ min: -3, max: 3.4 });
  });
});

describe('snapToSquare', () => {
  it('should move a value to the nearest square boundary', () => {
    expect(snapToSquare(1.4, 0.5)).toBe(1.5);
    expect(snapToSquare(-1.4, 0.5)).toBe(-1.5);
    expect(snapToSquare(63, 20)).toBe(60);
  });

  it('should snap a value on a non-dyadic grid without floating point noise', () => {
    expect(snapToSquare(0.55, 0.2)).toBe(0.6);
    expect(snapToSquare(1.4, 0.3)).toBe(1.5);
  });

  it('should stay identical to the half unit grid for the default scale', () => {
    const values = [-3.26, -0.74, 0, 0.24, 1.4, 7.13];

    expect(values.map(value => snapToSquare(value, 0.5))).toEqual(
      values.map(value => Math.round(value * 2) / 2),
    );
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

describe('axisOrigin', () => {
  it('should stay at zero when both ranges contain it', () => {
    expect(
      axisOrigin({ x: { min: -3, max: 3 }, y: { min: -200, max: 200 } }),
    ).toEqual({ x: 0, y: 0 });
  });

  it('should move to the minimum of a range above zero', () => {
    expect(
      axisOrigin({ x: { min: 9, max: 20 }, y: { min: 2, max: 8 } }),
    ).toEqual({ x: 9, y: 2 });
  });

  it('should move to the maximum of a range below zero', () => {
    expect(
      axisOrigin({ x: { min: -20, max: -9 }, y: { min: -8, max: -2 } }),
    ).toEqual({ x: -9, y: -2 });
  });

  it('should stay at zero when a bound sits exactly on it', () => {
    expect(
      axisOrigin({ x: { min: 0, max: 10 }, y: { min: -10, max: 0 } }),
    ).toEqual({ x: 0, y: 0 });
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
