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
  AreaPoint,
  MarkerNamingScheme,
  Plot,
  PlotSettings,
} from '../../models/plot';
import { MarkerNamingService } from '../../services/marker-naming.service';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';
import { PlotService } from '../../services/plot/plot.service';
import { plotHasErrorCode, PlotSizeMm } from '../../services/plot/plot.types';
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

export function nameAreaPoints(
  points: readonly { x: number; y: number }[],
  scheme: MarkerNamingScheme,
  service: MarkerNamingService,
  startIndex: number,
): AreaPoint[] {
  return points.map((p, i) => ({
    x: p.x,
    y: p.y,
    labelPosition: 'auto',
    labelText: service.generateName(startIndex + i, scheme),
  }));
}

export const NEW_PLOT_ID = 'new';

const buildInitialPlot = (): Plot => ({
  version: lehrgraphtVersion,
  name: 'Neuer Plot',
  range: {
    x: { min: -3, max: 3 },
    y: { min: -3, max: 3 },
  },
  fnx: [
    {
      fnx: 'x',
      color: colors[0],
      legendPosition: 'none',
      lineStyle: 'solid',
    },
  ],
  markers: [],
  lines: [],
  areas: [],
  showAxis: true,
  showAxisLabels: true,
  placeAxisLabelsInside: true,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
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

const getNextLabelIndex = (model: Plot): number => {
  let index = 0;
  for (const area of model.areas) {
    if (area.showPoints) {
      index += area.points.length;
    }
  }
  return index;
};

export function applyArea(
  model: Plot,
  points: readonly { x: number; y: number }[],
  ctx: ApplyContext,
): Plot {
  if (points.length === 0) return model;
  const startIndex = getNextLabelIndex(model);
  return {
    ...model,
    areas: [
      ...model.areas,
      {
        points: nameAreaPoints(
          points,
          ctx.scheme,
          ctx.markerNamingService,
          startIndex,
        ),
        color: nextColor(model.areas.length),
        showPoints: false,
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

export function applyLine(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  if (points.length < 2) return model;
  const [p1, p2] = points;
  return {
    ...model,
    lines: [
      ...model.lines,
      {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color: nextColor(model.lines.length),
        lineStyle: 'solid',
      },
    ],
  };
}

export function applyStraightLine(
  model: Plot,
  points: readonly { x: number; y: number }[],
  _ctx: ApplyContext,
): Plot {
  if (points.length < 2) return model;
  const fnxString = calculateStraightLineFunction(points[0], points[1]);
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

export const INTERACTIVE_STRATEGIES: Record<
  Exclude<InteractiveMode, InteractiveMode.Off>,
  InteractiveStrategy
> = {
  [InteractiveMode.Area]: { minPoints: 3, apply: applyArea },
  [InteractiveMode.Marker]: { minPoints: 1, apply: applyMarker },
  [InteractiveMode.Line]: { minPoints: 2, autoFinishAt: 2, apply: applyLine },
  [InteractiveMode.StraightLine]: {
    minPoints: 2,
    autoFinishAt: 2,
    apply: applyStraightLine,
  },
};

export type CardSectionKey = 'fnx' | 'markers' | 'lines' | 'areas';

export interface ExpandedItems {
  fnx: number[];
  markers: number[];
  lines: number[];
  areas: number[];
}

export function emptyExpandedItems(): ExpandedItems {
  return { fnx: [], markers: [], lines: [], areas: [] };
}

export const PlotEditorStore = signalStore(
  withProps(() => {
    const plotService = inject(PlotService);
    const wordService = inject(WordService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);

    const model = signal<Plot>(buildInitialPlot());
    const plotSettings = signal<PlotSettings>(defaultPlotSettings);
    const activeId = signal<string | null>(null);
    const isLoading = signal(false);

    const saveToDocument = async (): Promise<boolean> => {
      const m = model();
      const plot = await plotService.generate(m, plotSettings(), {
        applyScaleFactor: wordService.plotGenerationSettings.applyScaleFactor,
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
      },

      removeFx(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          fnx: removeAt(m.fnx, index),
        }));
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
      },

      removeMarker(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          markers: removeAt(m.markers, index),
        }));
      },

      addLine(): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          lines: [
            ...m.lines,
            {
              x1: 0,
              y1: 0,
              x2: 1,
              y2: 1,
              color: nextColor(m.lines.length),
              lineStyle: 'solid',
            },
          ],
        }));
      },

      removeLine(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          lines: removeAt(m.lines, index),
        }));
      },

      addArea(): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.editorForm().controlValue.update(m => {
          const startIndex = getNextLabelIndex(m);
          const rawPoints = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
          ];
          return {
            ...m,
            areas: [
              ...m.areas,
              {
                points: nameAreaPoints(
                  rawPoints,
                  scheme,
                  markerNamingService,
                  startIndex,
                ),
                color: nextColor(m.areas.length),
                showPoints: false,
              },
            ],
          };
        });
      },

      removeArea(index: number): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          areas: removeAt(m.areas, index),
        }));
      },

      addAreaPoint(areaIndex: number): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.editorForm().controlValue.update(m => {
          const nextIndex = getNextLabelIndex(m);
          const areas = m.areas.map((area, i) =>
            i === areaIndex
              ? {
                  ...area,
                  points: [
                    ...area.points,
                    ...nameAreaPoints(
                      [{ x: 0, y: 0 }],
                      scheme,
                      markerNamingService,
                      nextIndex,
                    ),
                  ],
                }
              : area,
          );
          return { ...m, areas };
        });
      },

      removeAreaPoint(event: { areaIndex: number; pointIndex: number }): void {
        store.editorForm().controlValue.update(m => ({
          ...m,
          areas: m.areas.map((area, i) =>
            i === event.areaIndex
              ? { ...area, points: removeAt(area.points, event.pointIndex) }
              : area,
          ),
        }));
      },

      autoAdjustLimits(): void {
        const m = store.model();
        const allPoints: { x: number; y: number }[] = [];

        for (const line of m.lines) {
          allPoints.push({ x: line.x1, y: line.y1 });
          allPoints.push({ x: line.x2, y: line.y2 });
        }
        for (const marker of m.markers) {
          allPoints.push({ x: marker.x, y: marker.y });
        }
        for (const area of m.areas) {
          allPoints.push(...area.points);
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
        const strategy = INTERACTIVE_STRATEGIES[mode];
        const points = [...store.interactivePoints(), event];
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
          }
          store.isLoading.set(false);
        });
      });
    },
  }),
);
