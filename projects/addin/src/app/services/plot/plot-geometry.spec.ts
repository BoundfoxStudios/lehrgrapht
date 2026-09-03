import { squareCounts } from './plot-geometry';

describe('squareCounts', () => {
  it('should count each axis from its own range when square plots are off', () => {
    expect(squareCounts(4, 10, false)).toEqual({ x: 8, y: 20 });
  });

  it('should count both axes from the larger range when square plots are on', () => {
    expect(squareCounts(4, 10, true)).toEqual({ x: 20, y: 20 });
  });

  it('should turn a range of six units into twelve squares', () => {
    expect(squareCounts(6, 6, false)).toEqual({ x: 12, y: 12 });
  });
});
