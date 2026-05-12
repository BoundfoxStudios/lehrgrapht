import { PolygonPoint, Reflection, ReflectionAxis } from '../../models/plot';
import { PlotRange } from '../../models/plot-range';

export interface Vec2 {
  x: number;
  y: number;
}

export function reflectPoint(p: Vec2, r: Reflection): Vec2 {
  if (r.kind === 'none') return { x: p.x, y: p.y };
  if (r.kind === 'point') {
    return { x: 2 * r.point.x - p.x, y: 2 * r.point.y - p.y };
  }
  const { p1, p2 } = r.axis;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: p.x, y: p.y };
  const t = ((p.x - p1.x) * dx + (p.y - p1.y) * dy) / lenSq;
  const fx = p1.x + t * dx;
  const fy = p1.y + t * dy;
  return { x: 2 * fx - p.x, y: 2 * fy - p.y };
}

export function reflectPolygonPoints(
  points: readonly PolygonPoint[],
  r: Reflection,
): PolygonPoint[] {
  return points.map(pt => {
    const reflected = reflectPoint({ x: pt.x, y: pt.y }, r);
    return {
      ...pt,
      x: reflected.x,
      y: reflected.y,
    };
  });
}

export function computeAxisLineEndpoints(
  axis: ReflectionAxis,
  range: PlotRange,
): [Vec2, Vec2] | null {
  const dx = axis.p2.x - axis.p1.x;
  const dy = axis.p2.y - axis.p1.y;
  if (dx === 0 && dy === 0) return null;

  if (dx === 0) {
    if (axis.p1.x < range.x.min || axis.p1.x > range.x.max) return null;
    return [
      { x: axis.p1.x, y: range.y.min },
      { x: axis.p1.x, y: range.y.max },
    ];
  }

  if (dy === 0) {
    if (axis.p1.y < range.y.min || axis.p1.y > range.y.max) return null;
    return [
      { x: range.x.min, y: axis.p1.y },
      { x: range.x.max, y: axis.p1.y },
    ];
  }

  // Parametrize: (axis.p1.x + t*dx, axis.p1.y + t*dy). Compute t at each
  // border, keep those inside the perpendicular range.
  const candidates: { t: number; point: Vec2 }[] = [];
  const txMin = (range.x.min - axis.p1.x) / dx;
  const txMax = (range.x.max - axis.p1.x) / dx;
  const tyMin = (range.y.min - axis.p1.y) / dy;
  const tyMax = (range.y.max - axis.p1.y) / dy;

  for (const t of [txMin, txMax, tyMin, tyMax]) {
    const x = axis.p1.x + t * dx;
    const y = axis.p1.y + t * dy;
    if (
      x >= range.x.min - 1e-9 &&
      x <= range.x.max + 1e-9 &&
      y >= range.y.min - 1e-9 &&
      y <= range.y.max + 1e-9
    ) {
      candidates.push({ t, point: { x, y } });
    }
  }

  if (candidates.length < 2) return null;
  candidates.sort((a, b) => a.t - b.t);
  return [candidates[0].point, candidates[candidates.length - 1].point];
}
