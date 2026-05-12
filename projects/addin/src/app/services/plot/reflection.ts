import { Reflection } from '../../models/plot';

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
