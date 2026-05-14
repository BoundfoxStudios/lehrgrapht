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
import { form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { lehrgraphtVersion } from '../../../version';
import {
  FunctionLineStyle,
  Plot,
  PlotSettings,
  Polygon,
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
import { WordPlotService } from '../../services/office/plot/word-plot.service';
import { PlotClickEvent } from '../plot-preview/plot-preview';
import { InteractiveMode } from './interactive-mode';
import { nextColor } from '../../utils/next-color';
import { removeAt, shiftIndicesAfterRemove } from '../../utils/array-utils';
import {
  applyAutoLabelToPolygon,
  ClippedSubsegment,
  clipSegmentByOccluders,
  isFrontEdgeFacingShift,
  isPolygonCCW,
  mergeContiguousSubsegments,
} from '../../utils/polygon-utils';
import { lessThanValidator } from '../../utils/less-than.validator';
import {
  ApplyContext,
  applyPolygon,
  INTERACTIVE_STRATEGIES,
  previousAxisStyle,
  previousReflectionIsSolution,
} from './interactive-strategy';

export const NEW_PLOT_ID = 'new';

const emptyPlot = (): Plot => ({
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
    const wordService = inject(WordPlotService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const solutionViewService = inject(SolutionViewService);

    const model = signal<Plot>(emptyPlot());
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
        if (mode === InteractiveMode.Off) {
          return model;
        }
        return INTERACTIVE_STRATEGIES[mode].apply(
          model,
          store.interactivePoints(),
          {
            scheme: store.plotSettings().markerNamingScheme,
            markerNamingService,
          },
        );
      }),
      hasAnySolution: computed(() => {
        const model = store.model();
        if (model.reflection.kind !== 'none' && model.reflection.isSolution) {
          return true;
        }
        return model.polygons.some(polygon => polygon.isSolution);
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
          if (polygonIndex < 0 || polygonIndex >= m.polygons.length) {
            return m;
          }
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
          if (point.x < minX) {
            minX = point.x;
          }
          if (point.x > maxX) {
            maxX = point.x;
          }
          if (point.y < minY) {
            minY = point.y;
          }
          if (point.y > maxY) {
            maxY = point.y;
          }
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
        if (mode === InteractiveMode.Off) {
          return;
        }
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
        if (mode === InteractiveMode.Off) {
          return;
        }

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
          reflection: {
            kind: 'point',
            point: { x: point.x, y: point.y },
            isSolution: previousReflectionIsSolution(m),
          },
        }));
      },

      setReflectionAxis(
        p1: { x: number; y: number },
        p2: { x: number; y: number },
      ): void {
        // Akzeptiert auch degenerate Achsen (p1 === p2) — das UI zeigt die Validierung als Fehlermeldung an,
        // damit der Nutzer beim Eintippen der 4 Koordinaten Zwischenzustände sehen kann.
        // `applyReflectionAxis` (interactive) verhindert degenerate Commits separat.
        store.editorForm().controlValue.update(m => {
          const style = previousAxisStyle(m);
          return {
            ...m,
            reflection: {
              kind: 'axis',
              axis: {
                p1: { x: p1.x, y: p1.y },
                p2: { x: p2.x, y: p2.y },
              },
              isSolution: previousReflectionIsSolution(m),
              color: style.color,
              lineStyle: style.lineStyle,
              extendBeyondPoints: style.extendBeyondPoints,
            },
          };
        });
      },

      setReflectionAxisColor(color: string): void {
        store.editorForm().controlValue.update(m => {
          if (m.reflection.kind !== 'axis') {
            return m;
          }
          return {
            ...m,
            reflection: { ...m.reflection, color },
          };
        });
      },

      setReflectionAxisLineStyle(lineStyle: FunctionLineStyle): void {
        store.editorForm().controlValue.update(m => {
          if (m.reflection.kind !== 'axis') {
            return m;
          }
          return {
            ...m,
            reflection: { ...m.reflection, lineStyle },
          };
        });
      },

      setReflectionAxisExtendBeyondPoints(extendBeyondPoints: boolean): void {
        store.editorForm().controlValue.update(m => {
          if (m.reflection.kind !== 'axis') {
            return m;
          }
          return {
            ...m,
            reflection: { ...m.reflection, extendBeyondPoints },
          };
        });
      },

      toggleReflectionIsSolution(): void {
        store.editorForm().controlValue.update(m => {
          if (m.reflection.kind === 'none') {
            return m;
          }
          return {
            ...m,
            reflection: {
              ...m.reflection,
              isSolution: !m.reflection.isSolution,
            },
          };
        });
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
      const wordService = inject(WordPlotService);
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
