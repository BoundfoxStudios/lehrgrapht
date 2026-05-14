export const colors = ['#3737d0', '#af2c2c', '#2a8c1a', '#f18238'];

export function nextColor(count: number): string {
  return colors[count % colors.length];
}
