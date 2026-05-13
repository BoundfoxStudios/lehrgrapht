import { computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { form, SchemaPath, validate } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { lehrgraphtVersion } from '../../../version';
import {
  MarkerNamingScheme,
  Plot,
  PlotSettings,
  Polygon,
  PolygonPoint,
} from '../../models/plot';
import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';
import { reflectPoint } from '../../services/plot/reflection';
import { PlotService } from '../../services/plot/plot.service';
import { plotHasErrorCode, PlotSizeMm } from '../../services/plot/plot.types';
import { SolutionViewService } from '../../services/solution-view.service';
import { WordService } from '../../services/word/word.service';
import { PlotClickEvent } from '../plot-preview/plot-preview';
import { InteractiveMode } from './interactive-mode';

const colors = ['#3737d0', '#af2c2c', '#2a8c1a', '#f18238'];

export function nextColor(count: number): string {
  return colors[count % colors.length];
}

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

export function namePolygonPoints(
  points: readonly { x: number; y: number }[],
  scheme: MarkerNamingScheme,
  service: MarkerNamingService,
  startIndex: number,
): PolygonPoint[] {
  return points.map((p, i) => ({
    x: p.x,
    y: p.y,
    labelPosition: 'auto',
    labelText: service.generateName(startIndex + i, scheme),
  }));
}

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
  if (Math.abs(cross) > GEO_EPS) return false;
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
    if (pointOnSegment(point, polygon[j], polygon[i])) return false;
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
  if (Math.abs(denom) < GEO_EPS) return null;
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
    if (t2 - t1 < GEO_EPS) continue;
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

export const NEW_PLOT_ID = 'new';

const buildInitialPlot = (): Plot => ({
  version: lehrgraphtVersion,
  name: 'Neuer Plot',
  range: {
    x: { min: -3, max: 3 },
    y: { min: -3, max: 3 },
  },
  fnx: [],
  markers: [],
  polygons: [],
  showAxis: true,
  showAxisLabels: true,
  placeAxisLabelsInside: true,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
  showAxisArrows: true,
  gridStep: '0.5',
  reflection: { kind: 'none' },
});

const lessThanValidator = (
  fieldA: SchemaPath<number>,
  fieldB: SchemaPath<number>,
  message: string,
): void => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  validate(fieldA, ({ value, valueOf }) => {
    const fieldAValue = value();
    const fieldBValue = valueOf(fieldB);

    if (fieldAValue >= fieldBValue) {
      return {
        field: fieldA,
        message,
        kind: 'lessThan',
      };
    }

    return null;
  });
};

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

export function isPolygonClosingClick(
  mode: InteractiveMode,
  currentPoints: readonly { x: number; y: number }[],
  click: { x: number; y: number },
): boolean {
  return (
    mode === InteractiveMode.Polygon &&
    currentPoints.length >= 3 &&
    currentPoints[0].x === click.x &&
    currentPoints[0].y === click.y
  );
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
      if (cross !== 0) continue;
      const between =
        b.x >= Math.min(a.x, c.x) &&
        b.x <= Math.max(a.x, c.x) &&
        b.y >= Math.min(a.y, c.y) &&
        b.y <= Math.max(a.y, c.y);
      if (!between) continue;
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
  if (deduped.length < 2) return model;
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
  if (points.length === 0) return model;
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
  if (fnxString === null) return model;
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

export function applyReflectionPoint(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  if (points.length < 1) return model;
  const point = points[0];
  return {
    ...model,
    reflection: { kind: 'point', point: { x: point.x, y: point.y } },
  };
}

export function applyReflectionAxis(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  if (points.length < 2) return model;
  const [p1, p2] = points;
  if (p1.x === p2.x && p1.y === p2.y) return model;
  return {
    ...model,
    reflection: {
      kind: 'axis',
      axis: { p1: { x: p1.x, y: p1.y }, p2: { x: p2.x, y: p2.y } },
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

export type CardSectionKey = 'fnx' | 'markers' | 'polygons';

export interface ExpandedItems {
  fnx: number[];
  markers: number[];
  polygons: number[];
}

export function emptyExpandedItems(): ExpandedItems {
  return { fnx: [], markers: [], polygons: [] };
}

export const PlotEditorStore = signalStore(
  withProps(() => {
    const plotService = inject(PlotService);
    const wordService = inject(WordService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const solutionViewService = inject(SolutionViewService);

    const model = signal<Plot>(buildInitialPlot());
    const plotSettings = signal<PlotSettings>(defaultPlotSettings);
    const activeId = signal<string | null>(null);
    const isLoading = signal(false);

    const saveToDocument = async (): Promise<boolean> => {
      const m = model();
      const plot = await plotService.generate(m, plotSettings(), {
        applyScaleFactor: wordService.plotGenerationSettings.applyScaleFactor,
        showSolution: solutionViewService.showSolution(),
      });

      if (plotHasErrorCode(plot)) {
        return false;
      }

      const existingId = activeId();
      const id = existingId ?? plotService.generateId();

      await wordService.upsertPicture({
        model: m,
        id,
        base64Picture: plot.base64,
        existingId: existingId ?? undefined,
        height: plot.heightInPoints,
        width: plot.widthInPoints,
      });

      if (!existingId) {
        activeId.set(id);
      }
      editorForm().reset();
      return true;
    };

    const editorForm = form(
      model,
      schema => {
        lessThanValidator(
          schema.range.x.min,
          schema.range.x.max,
          'X Min muss kleiner sein als X Max',
        );
        lessThanValidator(
          schema.range.y.min,
          schema.range.y.max,
          'Y Min muss kleiner sein als Y Max',
        );
      },
      {
        submission: {
          action: async () => {
            const wasNew = activeId() === null;
            const success = await saveToDocument();
            if (success && wasNew) {
              const id = activeId();
              const section = route.firstChild?.snapshot.url[0]?.path;
              const command: unknown[] = section
                ? ['/plot/editor', id, section]
                : ['/plot/editor', id];
              void router.navigate(command);
            }
            return undefined;
          },
        },
      },
    );

    return {
      model,
      editorForm,
      plotSettings,
      activeId,
      isLoading,
      saveToDocument,
    };
  }),
  withState({
    interactiveMode: InteractiveMode.Off,
    interactivePoints: [] as { x: number; y: number }[],
    expandedItems: emptyExpandedItems(),
    hoveredPolygonIndex: null as number | null,
  }),
  withComputed(store => {
    const plotService = inject(PlotService);
    const markerNamingService = inject(MarkerNamingService);

    return {
      plotSizeMm: computed<PlotSizeMm>(() =>
        plotService.calculatePlotSizeMm(store.model()),
      ),
      isAnyInteractiveMode: computed(
        () => store.interactiveMode() !== InteractiveMode.Off,
      ),
      isEditMode: computed(() => store.activeId() !== null),
      routeId: computed(() => store.activeId() ?? NEW_PLOT_ID),
      isDirty: computed(() => store.editorForm().dirty()),
      hasErrors: computed(() => store.editorForm().errorSummary().length > 0),
      errorCount: computed(() => store.editorForm().errorSummary().length),
      previewModel: computed<Plot>(() => {
        const model = store.model();
        const mode = store.interactiveMode();
        if (mode === InteractiveMode.Off) return model;
        return INTERACTIVE_STRATEGIES[mode].apply(
          model,
          store.interactivePoints(),
          {
            scheme: store.plotSettings().markerNamingScheme,
            markerNamingService,
          },
        );
      }),
    };
  }),
  withMethods(store => {
    const markerNamingService = inject(MarkerNamingService);

    return {
      addFx(): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          fnx: [
            ...m.fnx,
            {
              fnx: 'x',
              color: nextColor(m.fnx.length),
              legendPosition: 'none',
              lineStyle: 'solid',
            },
          ],
        }));
        const newIndex = store.model().fnx.length - 1;
        patchState(store, {
          expandedItems: {
            ...store.expandedItems(),
            fnx: [...store.expandedItems().fnx, newIndex],
          },
        });
      },

      removeFx(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          fnx: removeAt(m.fnx, index),
        }));
        patchState(store, {
          expandedItems: {
            ...store.expandedItems(),
            fnx: shiftIndicesAfterRemove(store.expandedItems().fnx, index),
          },
        });
      },

      addMarker(): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.editorForm().controlValue.update(m => ({
          ...m,
          markers: [
            ...m.markers,
            {
              x: 0,
              y: 0,
              text: markerNamingService.generateName(m.markers.length, scheme),
            },
          ],
        }));
        const newIndex = store.model().markers.length - 1;
        patchState(store, {
          expandedItems: {
            ...store.expandedItems(),
            markers: [...store.expandedItems().markers, newIndex],
          },
        });
      },

      removeMarker(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          markers: removeAt(m.markers, index),
        }));
        patchState(store, {
          expandedItems: {
            ...store.expandedItems(),
            markers: shiftIndicesAfterRemove(
              store.expandedItems().markers,
              index,
            ),
          },
        });
      },

      addPolygon(): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          polygons: [
            ...m.polygons,
            {
              points: [
                { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
                { x: 1, y: 1, labelPosition: 'auto', labelText: '' },
              ],
              connect: false,
              lineColor: nextColor(m.polygons.length),
              fillColor: null,
              lineStyle: 'solid',
              showPoints: false,
              fillStyle: 'solid',
              isSolution: false,
            },
          ],
        }));
        const newIndex = store.model().polygons.length - 1;
        patchState(store, {
          expandedItems: {
            ...store.expandedItems(),
            polygons: [...store.expandedItems().polygons, newIndex],
          },
        });
      },

      removePolygon(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          polygons: removeAt(m.polygons, index),
        }));
        patchState(store, {
          expandedItems: {
            ...store.expandedItems(),
            polygons: shiftIndicesAfterRemove(
              store.expandedItems().polygons,
              index,
            ),
          },
        });
      },

      addPolygonPoint(polygonIndex: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          polygons: m.polygons.map((polygon, i) =>
            i === polygonIndex
              ? {
                  ...polygon,
                  points: [
                    ...polygon.points,
                    { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
                  ],
                }
              : polygon,
          ),
        }));
      },

      removePolygonPoint(event: {
        polygonIndex: number;
        pointIndex: number;
      }): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          polygons: m.polygons.map((polygon, i) =>
            i === event.polygonIndex
              ? {
                  ...polygon,
                  points: removeAt(polygon.points, event.pointIndex),
                }
              : polygon,
          ),
        }));
      },

      autoLabelPolygonPointsIfEmpty(polygonIndex: number): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.editorForm().controlValue.update(m => {
          if (polygonIndex < 0 || polygonIndex >= m.polygons.length) return m;
          let startIndex = 0;
          for (let i = 0; i < polygonIndex; i++) {
            startIndex += m.polygons[i].points.length;
          }
          return {
            ...m,
            polygons: m.polygons.map((polygon, i) =>
              i === polygonIndex
                ? applyAutoLabelToPolygon(
                    polygon,
                    scheme,
                    markerNamingService,
                    startIndex,
                  )
                : polygon,
            ),
          };
        });
      },

      createObliqueProjection(payload: {
        polygonIndex: number;
        offset: { x: number; y: number };
      }): void {
        store.editorForm().controlValue.update(m => {
          if (
            payload.polygonIndex < 0 ||
            payload.polygonIndex >= m.polygons.length
          ) {
            return m;
          }
          const source = m.polygons[payload.polygonIndex];
          const { x: dx, y: dy } = payload.offset;
          const n = source.points.length;

          const frontOutline = source.points.map(p => ({ x: p.x, y: p.y }));
          const shifted = source.points.map(p => ({
            x: p.x + dx,
            y: p.y + dy,
          }));

          const ccw = isPolygonCCW(frontOutline);
          const occluders: { x: number; y: number }[][] = [frontOutline];
          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            if (
              isFrontEdgeFacingShift(
                frontOutline[i],
                frontOutline[j],
                payload.offset,
                ccw,
              )
            ) {
              occluders.push([
                frontOutline[i],
                frontOutline[j],
                shifted[j],
                shifted[i],
              ]);
            }
          }

          const segments: ClippedSubsegment[] = [];
          const addClipped = (
            start: { x: number; y: number },
            end: { x: number; y: number },
          ): void => {
            const clipped = clipSegmentByOccluders(start, end, occluders);
            segments.push(...mergeContiguousSubsegments(clipped));
          };

          for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            addClipped(shifted[i], shifted[j]);
          }
          for (let i = 0; i < n; i++) {
            addClipped(source.points[i], shifted[i]);
          }

          const newPolygons: Polygon[] = segments.map(seg => ({
            points: [
              {
                x: seg.from.x,
                y: seg.from.y,
                labelPosition: 'auto',
                labelText: '',
              },
              {
                x: seg.to.x,
                y: seg.to.y,
                labelPosition: 'auto',
                labelText: '',
              },
            ],
            connect: false,
            lineColor: source.lineColor,
            fillColor: null,
            lineStyle: seg.hidden ? 'dashed' : 'solid',
            showPoints: false,
            fillStyle: 'outline',
            isSolution: source.isSolution,
          }));

          const updatedPolygons = m.polygons.map((p, i) =>
            i === payload.polygonIndex
              ? { ...p, fillStyle: 'outline' as const }
              : p,
          );

          return {
            ...m,
            polygons: [...updatedPolygons, ...newPolygons],
          };
        });
      },

      autoAdjustLimits(): void {
        const m = store.model();
        const allPoints: { x: number; y: number }[] = [];

        for (const marker of m.markers) {
          allPoints.push({ x: marker.x, y: marker.y });
        }
        for (const polygon of m.polygons) {
          allPoints.push(...polygon.points);
        }

        // Reflection definition itself must fit in the range (axis stützpunkte / point S).
        // Mirrored objects must also fit so the solution view never gets clipped.
        if (m.reflection.kind === 'point') {
          allPoints.push(m.reflection.point);
        } else if (m.reflection.kind === 'axis') {
          allPoints.push(m.reflection.axis.p1, m.reflection.axis.p2);
        }
        if (m.reflection.kind !== 'none') {
          const reflection = m.reflection;
          const originals = [
            ...m.markers.map(mk => ({ x: mk.x, y: mk.y })),
            ...m.polygons.flatMap(p =>
              p.points.map(pt => ({ x: pt.x, y: pt.y })),
            ),
          ];
          for (const p of originals) {
            allPoints.push(reflectPoint(p, reflection));
          }
        }

        if (!allPoints.length) {
          return;
        }

        let minX = allPoints[0].x;
        let maxX = allPoints[0].x;
        let minY = allPoints[0].y;
        let maxY = allPoints[0].y;

        for (const point of allPoints) {
          if (point.x < minX) minX = point.x;
          if (point.x > maxX) maxX = point.x;
          if (point.y < minY) minY = point.y;
          if (point.y > maxY) maxY = point.y;
        }

        store.editorForm().controlValue.update(model => ({
          ...model,
          range: {
            x: { min: minX - 1, max: maxX + 1 },
            y: { min: minY - 1, max: maxY + 1 },
          },
        }));
      },

      startInteractive(
        mode: Exclude<InteractiveMode, InteractiveMode.Off>,
      ): void {
        patchState(store, { interactiveMode: mode, interactivePoints: [] });
      },

      cancelInteractive(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      finishInteractive(): void {
        const mode = store.interactiveMode();
        if (mode === InteractiveMode.Off) return;
        const strategy = INTERACTIVE_STRATEGIES[mode];
        const points = store.interactivePoints();
        if (points.length >= strategy.minPoints) {
          const ctx: ApplyContext = {
            scheme: store.plotSettings().markerNamingScheme,
            markerNamingService,
          };
          store
            .editorForm()
            .controlValue.update(m => strategy.apply(m, points, ctx));
        }
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      removeInteractivePoint(index: number): void {
        patchState(store, {
          interactivePoints: store
            .interactivePoints()
            .filter((_, i) => i !== index),
        });
      },

      onPlotClick(event: PlotClickEvent): void {
        const mode = store.interactiveMode();
        if (mode === InteractiveMode.Off) return;

        const currentPoints = store.interactivePoints();

        if (isPolygonClosingClick(mode, currentPoints, event)) {
          const ctx: ApplyContext = {
            scheme: store.plotSettings().markerNamingScheme,
            markerNamingService,
          };
          store.editorForm().controlValue.update(m => {
            const updated = applyPolygon(m, currentPoints, ctx);
            const lastIndex = updated.polygons.length - 1;
            return {
              ...updated,
              polygons: updated.polygons.map((p, i) =>
                i === lastIndex ? { ...p, connect: true } : p,
              ),
            };
          });
          patchState(store, {
            interactiveMode: InteractiveMode.Off,
            interactivePoints: [],
          });
          return;
        }

        const strategy = INTERACTIVE_STRATEGIES[mode];
        const points = [...currentPoints, event];
        if (strategy.autoFinishAt && points.length >= strategy.autoFinishAt) {
          const ctx: ApplyContext = {
            scheme: store.plotSettings().markerNamingScheme,
            markerNamingService,
          };
          store
            .editorForm()
            .controlValue.update(m => strategy.apply(m, points, ctx));
          patchState(store, {
            interactiveMode: InteractiveMode.Off,
            interactivePoints: [],
          });
        } else {
          patchState(store, { interactivePoints: points });
        }
      },

      toggleCardExpanded(section: CardSectionKey, index: number): void {
        const current = store.expandedItems()[section];
        const next = current.includes(index)
          ? current.filter(i => i !== index)
          : [...current, index];
        patchState(store, {
          expandedItems: { ...store.expandedItems(), [section]: next },
        });
      },

      expandAllCards(section: CardSectionKey): void {
        const length = store.model()[section].length;
        const next = Array.from({ length }, (_, i) => i);
        patchState(store, {
          expandedItems: { ...store.expandedItems(), [section]: next },
        });
      },

      collapseAllCards(section: CardSectionKey): void {
        patchState(store, {
          expandedItems: { ...store.expandedItems(), [section]: [] },
        });
      },

      setHoveredPolygon(index: number | null): void {
        patchState(store, { hoveredPolygonIndex: index });
      },

      setReflectionPoint(point: { x: number; y: number }): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          reflection: { kind: 'point', point: { x: point.x, y: point.y } },
        }));
      },

      setReflectionAxis(
        p1: { x: number; y: number },
        p2: { x: number; y: number },
      ): void {
        // Akzeptiert auch degenerate Achsen (p1 === p2) — das UI zeigt die Validierung als Fehlermeldung an,
        // damit der Nutzer beim Eintippen der 4 Koordinaten Zwischenzustände sehen kann.
        // `applyReflectionAxis` (interactive) verhindert degenerate Commits separat.
        store.editorForm().controlValue.update(m => ({
          ...m,
          reflection: {
            kind: 'axis',
            axis: {
              p1: { x: p1.x, y: p1.y },
              p2: { x: p2.x, y: p2.y },
            },
          },
        }));
      },

      removeReflection(): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          reflection: { kind: 'none' },
        }));
      },
    };
  }),
  withHooks({
    onInit(store) {
      const route = inject(ActivatedRoute);
      const wordService = inject(WordService);
      const plotSettingsService = inject(PlotSettingsService);

      const settings = plotSettingsService.get();
      store.plotSettings.set(settings);
      store.model.update(m => ({
        ...m,
        legendLabelFormat: settings.legendLabelFormat,
      }));

      const idSignal = toSignal(route.paramMap.pipe(map(p => p.get('id'))), {
        initialValue: null as string | null,
      });

      effect(() => {
        const id = idSignal();
        if (!id || id === NEW_PLOT_ID) {
          store.activeId.set(null);
          return;
        }
        store.activeId.set(id);
        store.isLoading.set(true);
        void wordService.get(id).then(loaded => {
          if (loaded) {
            store.editorForm().reset(loaded.model);
            patchState(store, { expandedItems: emptyExpandedItems() });
          }
          store.isLoading.set(false);
        });
      });
    },
  }),
);
