import { MarkerNamingScheme, Plot } from '../../models/plot';
import { nextColor } from '../../utils/next-color';
import { InteractiveMode } from './interactive-mode';
import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  calculateParabolaFunction,
  calculateStraightLineFunction,
} from '../../utils/calculation-utils';

export interface ApplyContext {
  scheme: MarkerNamingScheme;
  markerNamingService: MarkerNamingService;
}

export interface InteractiveStrategy {
  /** Minimum points required for `finishInteractive()` to commit. */
  minPoints: number;
  /** If set, `onPlotClick` auto-commits when click count reaches this. */
  autoFinishAt?: number;
  /** Pure: produces a new Plot with the interactive points applied. */
  apply(
    model: Plot,
    points: readonly { x: number; y: number }[],
    ctx: ApplyContext,
  ): Plot;
}

export function dedupePolygonPoints(
  points: readonly { x: number; y: number }[],
): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (const p of points) {
    const last = result.at(-1);
    if (last?.x !== p.x || last.y !== p.y) {
      result.push({ x: p.x, y: p.y });
    }
  }

  // Run after the consecutive-duplicate pass so triples are guaranteed non-degenerate;
  // restart from the start after each splice because indices shift and a removal can expose new collinear triples.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 1; i < result.length - 1; i++) {
      const a = result[i - 1];
      const b = result[i];
      const c = result[i + 1];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (cross !== 0) {
        continue;
      }
      const between =
        b.x >= Math.min(a.x, c.x) &&
        b.x <= Math.max(a.x, c.x) &&
        b.y >= Math.min(a.y, c.y) &&
        b.y <= Math.max(a.y, c.y);
      if (!between) {
        continue;
      }
      result.splice(i, 1);
      changed = true;
      break;
    }
  }

  return result;
}

export function applyPolygon(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  const deduped = dedupePolygonPoints(points);
  if (deduped.length < 2) {
    return model;
  }
  return {
    ...model,
    polygons: [
      ...model.polygons,
      {
        points: deduped.map(p => ({
          x: p.x,
          y: p.y,
          labelPosition: 'auto',
          labelText: '',
        })),
        connect: false,
        lineColor: nextColor(model.polygons.length),
        fillColor: null,
        lineStyle: 'solid',
        showPoints: false,
        fillStyle: 'solid',
        isSolution: false,
      },
    ],
  };
}

export function applyMarker(
  model: Plot,
  points: readonly { x: number; y: number }[],
  ctx: ApplyContext,
): Plot {
  if (points.length === 0) {
    return model;
  }
  return {
    ...model,
    markers: [
      ...model.markers,
      ...points.map((p, i) => ({
        x: p.x,
        y: p.y,
        text: ctx.markerNamingService.generateName(
          model.markers.length + i,
          ctx.scheme,
        ),
      })),
    ],
  };
}

export function applyFunction(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  let fnxString: string | null;
  if (points.length === 2) {
    fnxString = calculateStraightLineFunction(points[0], points[1]);
  } else if (points.length >= 3) {
    fnxString = calculateParabolaFunction(points[0], points[1], points[2]);
  } else {
    return model;
  }
  if (fnxString === null) {
    return model;
  }
  return {
    ...model,
    fnx: [
      ...model.fnx,
      {
        fnx: fnxString,
        color: nextColor(model.fnx.length),
        legendPosition: 'none',
        lineStyle: 'solid',
      },
    ],
  };
}

export function previousReflectionIsSolution(model: Plot): boolean {
  return model.reflection.kind === 'none' ? false : model.reflection.isSolution;
}

export function applyReflectionPoint(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  if (points.length < 1) {
    return model;
  }
  const point = points[0];
  return {
    ...model,
    reflection: {
      kind: 'point',
      point: { x: point.x, y: point.y },
      isSolution: previousReflectionIsSolution(model),
    },
  };
}

export function applyReflectionAxis(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  if (points.length < 2) {
    return model;
  }
  const [p1, p2] = points;
  if (p1.x === p2.x && p1.y === p2.y) {
    return model;
  }
  return {
    ...model,
    reflection: {
      kind: 'axis',
      axis: { p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p2.y } },
      isSolution: previousReflectionIsSolution(model),
    },
  };
}

export const INTERACTIVE_STRATEGIES: Record<
  Exclude<InteractiveMode, InteractiveMode.Off>,
  InteractiveStrategy
> = {
  [InteractiveMode.Polygon]: { minPoints: 2, apply: applyPolygon },
  [InteractiveMode.Marker]: { minPoints: 1, apply: applyMarker },
  [InteractiveMode.Function]: {
    minPoints: 2,
    autoFinishAt: 3,
    apply: applyFunction,
  },
  [InteractiveMode.ReflectionPoint]: {
    minPoints: 1,
    autoFinishAt: 1,
    apply: applyReflectionPoint,
  },
  [InteractiveMode.ReflectionAxis]: {
    minPoints: 2,
    autoFinishAt: 2,
    apply: applyReflectionAxis,
  },
};
