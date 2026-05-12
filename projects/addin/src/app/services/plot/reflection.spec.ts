import { Reflection } from '../../models/plot';
import { reflectPoint } from './reflection';

describe('reflectPoint', () => {
  it('returns input unchanged for kind="none"', () => {
    const r: Reflection = { kind: 'none' };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: 4 });
  });

  it('reflects through origin point', () => {
    const r: Reflection = { kind: 'point', point: { x: 0, y: 0 } };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: -3, y: -4 });
  });

  it('reflects through arbitrary point', () => {
    const r: Reflection = { kind: 'point', point: { x: 1, y: 2 } };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: -1, y: 0 });
  });

  it('reflects across x-axis (y=0)', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: -4 });
  });

  it('reflects across y-axis (x=0)', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 } },
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: -3, y: 4 });
  });

  it('reflects across y=x diagonal', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 4, y: 3 });
  });

  it('keeps a point that lies on the axis', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 1 }, p2: { x: 1, y: 2 } },
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: 4 });
  });

  it('reflects across y=x+1 for an off-axis point', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 0, y: 1 }, p2: { x: 1, y: 2 } },
    };
    expect(reflectPoint({ x: 0, y: 0 }, r)).toEqual({ x: -1, y: 1 });
  });

  it('returns input unchanged for degenerate axis (p1 === p2)', () => {
    const r: Reflection = {
      kind: 'axis',
      axis: { p1: { x: 1, y: 1 }, p2: { x: 1, y: 1 } },
    };
    expect(reflectPoint({ x: 3, y: 4 }, r)).toEqual({ x: 3, y: 4 });
  });
});
