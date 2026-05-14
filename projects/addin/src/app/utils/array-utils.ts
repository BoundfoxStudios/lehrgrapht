export function removeAt<T>(arr: readonly T[], index: number): T[] {
  const next = [...arr];
  next.splice(index, 1);
  return next;
}

export function shiftIndicesAfterRemove(
  indices: readonly number[],
  removedIndex: number,
): number[] {
  const result: number[] = [];
  for (const index of indices) {
    if (index < removedIndex) {
      result.push(index);
    } else if (index > removedIndex) {
      result.push(index - 1);
    }
  }
  return result;
}
