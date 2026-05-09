import { MarkerNamingService } from '../../services/marker-naming.service';
import { nameAreaPoints, nextColor, removeAt } from './plot-editor.store';

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
