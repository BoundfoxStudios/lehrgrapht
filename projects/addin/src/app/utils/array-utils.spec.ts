import { removeAt, shiftIndicesAfterRemove } from './array-utils';

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
