import type { Plot, UnitsPerSquare } from '../../models/plot';
import { renderScale, squareCounts } from './plot-geometry';

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
