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
import { Plot } from '../../models/plot';
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

const calculateStraightLineFunction = (
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

const getNextLabelIndex = (model: Plot): number => {
  let index = 0;
  for (const area of model.areas) {
    if (area.showPoints) {
      index += area.points.length;
    }
  }
  return index;
};

export const PlotEditorStore = signalStore(
  withProps(() => {
    const model = signal<Plot>(buildInitialPlot());
    const editorForm = form(model, schema => {
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
    });
    return { model, editorForm };
  }),
  withState({
    plotSettings: defaultPlotSettings,
    interactiveMode: InteractiveMode.Off,
    interactivePoints: [] as { x: number; y: number }[],
    activeId: null as string | null,
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
      hasErrors: computed(() => store.editorForm().errorSummary().length > 0),
      errorCount: computed(() => store.editorForm().errorSummary().length),
      previewModel: computed<Plot>(() => {
        const model = store.model();
        const mode = store.interactiveMode();
        const scheme = store.plotSettings().markerNamingScheme;
        const pts = store.interactivePoints();

        let areas = model.areas;
        let markers = model.markers;
        let lines = model.lines;
        let fnx = model.fnx;

        if (mode === InteractiveMode.Area && pts.length > 0) {
          const startIndex = getNextLabelIndex(model);
          areas = [
            ...areas,
            {
              points: pts.map((p, i) => ({
                ...p,
                labelPosition: 'auto' as const,
                labelText: markerNamingService.generateName(
                  startIndex + i,
                  scheme,
                ),
              })),
              color: colors[areas.length % colors.length],
              showPoints: false,
            },
          ];
        }

        if (mode === InteractiveMode.Marker && pts.length > 0) {
          markers = [
            ...markers,
            ...pts.map((p, i) => ({
              ...p,
              text: markerNamingService.generateName(
                markers.length + i,
                scheme,
              ),
            })),
          ];
        }

        if (mode === InteractiveMode.Line && pts.length === 2) {
          lines = [
            ...lines,
            {
              x1: pts[0].x,
              y1: pts[0].y,
              x2: pts[1].x,
              y2: pts[1].y,
              color: colors[lines.length % colors.length],
              lineStyle: 'solid',
            },
          ];
        }

        if (mode === InteractiveMode.StraightLine && pts.length === 2) {
          const fnxString = calculateStraightLineFunction(pts[0], pts[1]);
          if (fnxString) {
            fnx = [
              ...fnx,
              {
                fnx: fnxString,
                color: colors[fnx.length % colors.length],
                legendPosition: 'none',
                lineStyle: 'solid',
              },
            ];
          }
        }

        return { ...model, areas, markers, lines, fnx };
      }),
    };
  }),
  withMethods(store => {
    const markerNamingService = inject(MarkerNamingService);
    const plotService = inject(PlotService);
    const wordService = inject(WordService);
    const router = inject(Router);

    return {
      addFx(): void {
        store.model.update(m => ({
          ...m,
          fnx: [
            ...m.fnx,
            {
              fnx: 'x',
              color: colors[m.fnx.length % colors.length],
              legendPosition: 'none',
              lineStyle: 'solid',
            },
          ],
        }));
      },

      removeFx(index: number): void {
        store.model.update(m => {
          const fnx = [...m.fnx];
          fnx.splice(index, 1);
          return { ...m, fnx };
        });
      },

      addMarker(): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.model.update(m => ({
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
        store.model.update(m => {
          const markers = [...m.markers];
          markers.splice(index, 1);
          return { ...m, markers };
        });
      },

      addLine(): void {
        store.model.update(m => ({
          ...m,
          lines: [
            ...m.lines,
            {
              x1: 0,
              y1: 0,
              x2: 1,
              y2: 1,
              color: colors[m.lines.length % colors.length],
              lineStyle: 'solid',
            },
          ],
        }));
      },

      removeLine(index: number): void {
        store.model.update(m => {
          const lines = [...m.lines];
          lines.splice(index, 1);
          return { ...m, lines };
        });
      },

      addArea(): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.model.update(m => {
          const startIndex = getNextLabelIndex(m);
          return {
            ...m,
            areas: [
              ...m.areas,
              {
                points: [
                  {
                    x: 0,
                    y: 0,
                    labelPosition: 'auto',
                    labelText: markerNamingService.generateName(
                      startIndex,
                      scheme,
                    ),
                  },
                  {
                    x: 1,
                    y: 0,
                    labelPosition: 'auto',
                    labelText: markerNamingService.generateName(
                      startIndex + 1,
                      scheme,
                    ),
                  },
                  {
                    x: 1,
                    y: 1,
                    labelPosition: 'auto',
                    labelText: markerNamingService.generateName(
                      startIndex + 2,
                      scheme,
                    ),
                  },
                ],
                color: colors[m.areas.length % colors.length],
                showPoints: false,
              },
            ],
          };
        });
      },

      removeArea(index: number): void {
        store.model.update(m => {
          const areas = [...m.areas];
          areas.splice(index, 1);
          return { ...m, areas };
        });
      },

      addAreaPoint(areaIndex: number): void {
        const scheme = store.plotSettings().markerNamingScheme;
        store.model.update(m => {
          const nextIndex = getNextLabelIndex(m);
          const areas = m.areas.map((area, i) =>
            i === areaIndex
              ? {
                  ...area,
                  points: [
                    ...area.points,
                    {
                      x: 0,
                      y: 0,
                      labelPosition: 'auto' as const,
                      labelText: markerNamingService.generateName(
                        nextIndex,
                        scheme,
                      ),
                    },
                  ],
                }
              : area,
          );
          return { ...m, areas };
        });
      },

      removeAreaPoint(event: { areaIndex: number; pointIndex: number }): void {
        store.model.update(m => {
          const areas = m.areas.map((area, i) => {
            if (i !== event.areaIndex) return area;
            const points = [...area.points];
            points.splice(event.pointIndex, 1);
            return { ...area, points };
          });
          return { ...m, areas };
        });
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

        store.model.update(model => ({
          ...model,
          range: {
            x: { min: minX - 1, max: maxX + 1 },
            y: { min: minY - 1, max: maxY + 1 },
          },
        }));
      },

      startInteractiveArea(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Area,
          interactivePoints: [],
        });
      },

      cancelInteractiveArea(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      finishInteractiveArea(): void {
        const points = store.interactivePoints();
        if (points.length >= 3) {
          const scheme = store.plotSettings().markerNamingScheme;
          store.model.update(m => {
            const startIndex = getNextLabelIndex(m);
            return {
              ...m,
              areas: [
                ...m.areas,
                {
                  points: points.map((p, i) => ({
                    ...p,
                    labelPosition: 'auto' as const,
                    labelText: markerNamingService.generateName(
                      startIndex + i,
                      scheme,
                    ),
                  })),
                  color: colors[m.areas.length % colors.length],
                  showPoints: false,
                },
              ],
            };
          });
        }
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      startInteractiveMarker(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Marker,
          interactivePoints: [],
        });
      },

      cancelInteractiveMarker(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      finishInteractiveMarker(): void {
        const points = store.interactivePoints();
        const scheme = store.plotSettings().markerNamingScheme;
        if (points.length > 0) {
          store.model.update(m => ({
            ...m,
            markers: [
              ...m.markers,
              ...points.map((p, i) => ({
                ...p,
                text: markerNamingService.generateName(
                  m.markers.length + i,
                  scheme,
                ),
              })),
            ],
          }));
        }
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      startInteractiveLine(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Line,
          interactivePoints: [],
        });
      },

      cancelInteractiveLine(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      startInteractiveStraightLine(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.StraightLine,
          interactivePoints: [],
        });
      },

      cancelInteractiveStraightLine(): void {
        patchState(store, {
          interactiveMode: InteractiveMode.Off,
          interactivePoints: [],
        });
      },

      cancelInteractiveIfActive(): void {
        if (store.interactiveMode() !== InteractiveMode.Off) {
          patchState(store, {
            interactiveMode: InteractiveMode.Off,
            interactivePoints: [],
          });
        }
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

        if (mode === InteractiveMode.Area || mode === InteractiveMode.Marker) {
          patchState(store, {
            interactivePoints: [...store.interactivePoints(), event],
          });
          return;
        }

        if (mode === InteractiveMode.Line) {
          const newPoints = [...store.interactivePoints(), event];
          if (newPoints.length === 2) {
            store.model.update(m => ({
              ...m,
              lines: [
                ...m.lines,
                {
                  x1: newPoints[0].x,
                  y1: newPoints[0].y,
                  x2: newPoints[1].x,
                  y2: newPoints[1].y,
                  color: colors[m.lines.length % colors.length],
                  lineStyle: 'solid',
                },
              ],
            }));
            patchState(store, {
              interactiveMode: InteractiveMode.Off,
              interactivePoints: [],
            });
          } else {
            patchState(store, { interactivePoints: newPoints });
          }
          return;
        }

        if (mode === InteractiveMode.StraightLine) {
          const newPoints = [...store.interactivePoints(), event];
          if (newPoints.length === 2) {
            const [p1, p2] = newPoints;
            const fnxString = calculateStraightLineFunction(p1, p2);
            if (fnxString) {
              store.model.update(m => ({
                ...m,
                fnx: [
                  ...m.fnx,
                  {
                    fnx: fnxString,
                    color: colors[m.fnx.length % colors.length],
                    legendPosition: 'none',
                    lineStyle: 'solid',
                  },
                ],
              }));
            }
            patchState(store, {
              interactiveMode: InteractiveMode.Off,
              interactivePoints: [],
            });
          } else {
            patchState(store, { interactivePoints: newPoints });
          }
          return;
        }
      },

      async sendToWord(): Promise<void> {
        const model = store.model();
        const plot = await plotService.generate(model, store.plotSettings(), {
          applyScaleFactor: wordService.plotGenerationSettings.applyScaleFactor,
        });

        if (plotHasErrorCode(plot)) {
          return;
        }

        const existingId = store.activeId();
        const id = existingId ?? plotService.generateId();

        await wordService.upsertPicture({
          model,
          id,
          base64Picture: plot.base64,
          existingId: existingId ?? undefined,
          height: plot.heightInPoints,
          width: plot.widthInPoints,
        });

        void router.navigate(['/plot/editor', id]);
      },
    };
  }),
  withHooks({
    onInit(store) {
      const route = inject(ActivatedRoute);
      const wordService = inject(WordService);
      const plotSettingsService = inject(PlotSettingsService);

      const settings = plotSettingsService.get();
      patchState(store, { plotSettings: settings });
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
          patchState(store, { activeId: null });
          return;
        }
        patchState(store, { activeId: id });
        void wordService.get(id).then(loaded => {
          if (loaded) {
            store.model.set(loaded.model);
          }
        });
      });
    },
  }),
);
