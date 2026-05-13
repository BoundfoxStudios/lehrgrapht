export const calculateStraightLineFunction = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): string | null => {
  if (p1.x === p2.x) {
    return null;
  }

  const m = (p2.y - p1.y) / (p2.x - p1.x);
  const b = p1.y - m * p1.x;

  const mRounded = Math.round(m * 100) / 100;
  const bRounded = Math.round(b * 100) / 100;

  if (mRounded === 0) {
    return `${bRounded}`;
  }

  const mStr = mRounded === 1 ? '' : mRounded === -1 ? '-' : `${mRounded}*`;

  if (bRounded === 0) {
    return `${mStr}x`;
  }

  const bStr = bRounded > 0 ? `+${bRounded}` : `${bRounded}`;
  return `${mStr}x${bStr}`;
};

export const calculateParabolaFunction = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): string | null => {
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  const { x: x3, y: y3 } = p3;

  const d12 = x1 - x2;
  const d13 = x1 - x3;
  const d23 = x2 - x3;
  if (d12 === 0 || d13 === 0 || d23 === 0) {
    return null;
  }

  const l1 = y1 / (d12 * d13);
  const l2 = y2 / (-d12 * d23);
  const l3 = y3 / (d13 * d23);

  const a = l1 + l2 + l3;
  const b = -(l1 * (x2 + x3) + l2 * (x1 + x3) + l3 * (x1 + x2));
  const c = l1 * x2 * x3 + l2 * x1 * x3 + l3 * x1 * x2;

  const aRounded = Math.round(a * 100) / 100;
  const bRounded = Math.round(b * 100) / 100;
  const cRounded = Math.round(c * 100) / 100;

  if (aRounded === 0) {
    // d13 !== 0 above makes the line non-vertical; the ?? satisfies strict-null-checks.
    return calculateStraightLineFunction(p1, p3) ?? `${cRounded}`;
  }

  const aStr = aRounded === 1 ? '' : aRounded === -1 ? '-' : `${aRounded}*`;
  let result = `${aStr}x^2`;

  if (bRounded !== 0) {
    const bAbs = Math.abs(bRounded);
    const bCoef = bAbs === 1 ? '' : `${bAbs}*`;
    result += `${bRounded > 0 ? '+' : '-'}${bCoef}x`;
  }

  if (cRounded !== 0) {
    result += cRounded > 0 ? `+${cRounded}` : `${cRounded}`;
  }

  return result;
};
