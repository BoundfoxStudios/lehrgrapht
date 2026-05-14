import { MarkerNamingScheme, Polygon } from '../models/plot';
import { MarkerNamingService } from '../services/marker-naming.service';

export function applyAutoLabelToPolygon(
  polygon: Polygon,
  scheme: MarkerNamingScheme,
  service: MarkerNamingService,
  startIndex: number,
): Polygon {
  if (polygon.points.some(p => p.labelText.trim() !== '')) {
    return polygon;
  }
  return {
    ...polygon,
    points: polygon.points.map((p, i) => ({
      ...p,
      labelText: service.generateName(startIndex + i, scheme),
    })),
  };
}

interface GeoPoint {
  x: number;
  y: number;
}

const GEO_EPS = 1e-9;

export function pointOnSegment(p: GeoPoint, a: GeoPoint, b: GeoPoint): boolean {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  if (Math.abs(cross) > GEO_EPS) {
    return false;
  }
  const minX = Math.min(a.x, b.x) - GEO_EPS;
  const maxX = Math.max(a.x, b.x) + GEO_EPS;
  const minY = Math.min(a.y, b.y) - GEO_EPS;
  const maxY = Math.max(a.y, b.y) + GEO_EPS;
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

export function pointInPolygon(
  point: GeoPoint,
  polygon: readonly GeoPoint[],
): boolean {
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    if (pointOnSegment(point, polygon[j], polygon[i])) {
      return false;
    }
  }
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function polygonSignedArea(polygon: readonly GeoPoint[]): number {
  let sum = 0;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    sum += polygon[j].x * polygon[i].y - polygon[i].x * polygon[j].y;
  }
  return sum / 2;
}

export function isPolygonCCW(polygon: readonly GeoPoint[]): boolean {
  return polygonSignedArea(polygon) > 0;
}

export function isFrontEdgeFacingShift(
  edgeStart: GeoPoint,
  edgeEnd: GeoPoint,
  shift: GeoPoint,
  ccw: boolean,
): boolean {
  const ex = edgeEnd.x - edgeStart.x;
  const ey = edgeEnd.y - edgeStart.y;
  const cross = ey * shift.x - ex * shift.y;
  return ccw ? cross > GEO_EPS : cross < -GEO_EPS;
}

export function segmentSegmentIntersectionT(
  p1: GeoPoint,
  p2: GeoPoint,
  p3: GeoPoint,
  p4: GeoPoint,
): number | null {
  const r1x = p2.x - p1.x;
  const r1y = p2.y - p1.y;
  const r2x = p4.x - p3.x;
  const r2y = p4.y - p3.y;
  const denom = r1x * r2y - r1y * r2x;
  if (Math.abs(denom) < GEO_EPS) {
    return null;
  }
  const t = ((p3.x - p1.x) * r2y - (p3.y - p1.y) * r2x) / denom;
  const u = ((p3.x - p1.x) * r1y - (p3.y - p1.y) * r1x) / denom;
  if (t < -GEO_EPS || t > 1 + GEO_EPS || u < -GEO_EPS || u > 1 + GEO_EPS) {
    return null;
  }
  return Math.max(0, Math.min(1, t));
}

export interface ClippedSubsegment {
  from: GeoPoint;
  to: GeoPoint;
  hidden: boolean;
}

export function clipSegmentByOccluders(
  start: GeoPoint,
  end: GeoPoint,
  occluders: readonly (readonly GeoPoint[])[],
): ClippedSubsegment[] {
  const tsSet = new Set<number>();
  tsSet.add(0);
  tsSet.add(1);
  for (const occluder of occluders) {
    const n = occluder.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const t = segmentSegmentIntersectionT(
        start,
        end,
        occluder[j],
        occluder[i],
      );
      if (t !== null && t > GEO_EPS && t < 1 - GEO_EPS) {
        tsSet.add(t);
      }
    }
  }
  const ts = [...tsSet].sort((a, b) => a - b);
  const interp = (t: number): GeoPoint => ({
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
  });
  const out: ClippedSubsegment[] = [];
  for (let k = 0; k < ts.length - 1; k++) {
    const t1 = ts[k];
    const t2 = ts[k + 1];
    if (t2 - t1 < GEO_EPS) {
      continue;
    }
    const mid = interp((t1 + t2) / 2);
    const hidden = occluders.some(o => pointInPolygon(mid, o));
    out.push({ from: interp(t1), to: interp(t2), hidden });
  }
  return out;
}

export function mergeContiguousSubsegments(
  subs: readonly ClippedSubsegment[],
): ClippedSubsegment[] {
  const out: ClippedSubsegment[] = [];
  for (const s of subs) {
    if (out.length === 0) {
      out.push({ ...s });
      continue;
    }
    const last = out[out.length - 1];
    if (
      last.hidden === s.hidden &&
      Math.abs(last.to.x - s.from.x) < GEO_EPS &&
      Math.abs(last.to.y - s.from.y) < GEO_EPS
    ) {
      out[out.length - 1] = { from: last.from, to: s.to, hidden: s.hidden };
    } else {
      out.push({ ...s });
    }
  }
  return out;
}
