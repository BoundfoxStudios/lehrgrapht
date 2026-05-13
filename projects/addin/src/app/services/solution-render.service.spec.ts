import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Plot, PlotSettings } from '../models/plot';
import { PlotService } from './plot/plot.service';
import { PlotGenerateErrorCode } from './plot/plot.types';
import {
  PlotSettingsService,
  defaultPlotSettings,
} from './plot-settings.service';
import { SolutionRenderService } from './solution-render.service';
import { SolutionViewService } from './solution-view.service';
import { WordPlot, WordService } from './word/word.service';

function makePlot(reflectionKind: 'none' | 'point' | 'axis'): Plot {
  return {
    version: '1.0',
    name: 'test',
    range: { x: { min: -5, max: 5 }, y: { min: -5, max: 5 } },
    fnx: [],
    markers: [],
    polygons: [],
    showAxis: true,
    showAxisLabels: true,
    placeAxisLabelsInside: false,
    squarePlots: false,
    automaticallyAdjustLimitsToValueRange: false,
    axisLabelX: 'x',
    axisLabelY: 'y',
    legendLabelFormat: 'none',
    showAxisArrows: false,
    gridStep: '1',
    reflection:
      reflectionKind === 'none'
        ? { kind: 'none' }
        : reflectionKind === 'point'
          ? { kind: 'point', point: { x: 0, y: 0 } }
          : {
              kind: 'axis',
              axis: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } },
            },
  };
}

type GenerateFn = (...args: unknown[]) => Promise<
  | {
      base64: string;
      widthInPx: number;
      heightInPx: number;
      widthInPoints: number;
      heightInPoints: number;
    }
  | PlotGenerateErrorCode
>;
type UpsertFn = (...args: unknown[]) => Promise<void>;

describe('SolutionRenderService', () => {
  let solutionView: SolutionViewService;
  let renderService: SolutionRenderService;
  let wordPlots: WordPlot[];
  let generateSpy: ReturnType<typeof vi.fn<GenerateFn>>;
  let upsertSpy: ReturnType<typeof vi.fn<UpsertFn>>;

  beforeEach(async () => {
    wordPlots = [];
    generateSpy = vi.fn<GenerateFn>(() =>
      Promise.resolve({
        base64: 'data:image/png;base64,fake',
        widthInPx: 100,
        heightInPx: 100,
        widthInPoints: 50,
        heightInPoints: 50,
      }),
    );
    upsertSpy = vi.fn<UpsertFn>(() => Promise.resolve());

    const wordServiceMock = {
      list: vi.fn(() => Promise.resolve(wordPlots)),
      plotGenerationSettings: { applyScaleFactor: false },
      upsertPicture: upsertSpy,
      selection: signal(undefined),
    };
    const plotServiceMock = { generate: generateSpy };
    const settingsServiceMock = {
      get: (): PlotSettings => defaultPlotSettings,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: WordService, useValue: wordServiceMock },
        { provide: PlotService, useValue: plotServiceMock },
        { provide: PlotSettingsService, useValue: settingsServiceMock },
      ],
    });

    // Instantiate render service so its effect registers and the initial run consumes firstRun.
    renderService = TestBed.inject(SolutionRenderService);
    solutionView = TestBed.inject(SolutionViewService);
    TestBed.tick();
    await flushMicrotasks();
  });

  async function flushSignalAndAsync(): Promise<void> {
    TestBed.tick();
    await flushMicrotasks();
  }

  it('does not regenerate on initial signal value', () => {
    expect(generateSpy).not.toHaveBeenCalled();
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('regenerates only plots with reflection.kind !== "none" when signal flips', async () => {
    wordPlots = [
      { id: 'a', model: makePlot('none') },
      { id: 'b', model: makePlot('point') },
      { id: 'c', model: makePlot('axis') },
    ];
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();

    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenCalledTimes(2);
  });

  it('skips plots without a model', async () => {
    wordPlots = [{ id: 'a' }];
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();

    expect(generateSpy).not.toHaveBeenCalled();
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('continues with other plots when one generate call returns an error code', async () => {
    wordPlots = [
      { id: 'a', model: makePlot('point') },
      { id: 'b', model: makePlot('axis') },
    ];
    generateSpy.mockImplementationOnce(() =>
      Promise.resolve(PlotGenerateErrorCode.evaluate),
    );
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();

    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
  });

  it('exposes a null progress initially', () => {
    expect(renderService.progress()).toBeNull();
  });

  it('clears progress after a normal run', async () => {
    wordPlots = [
      { id: 'a', model: makePlot('point') },
      { id: 'b', model: makePlot('axis') },
    ];
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();

    expect(renderService.progress()).toBeNull();
  });

  it('keeps progress null when there are no eligible plots', async () => {
    wordPlots = [{ id: 'a', model: makePlot('none') }];
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();

    expect(renderService.progress()).toBeNull();
  });

  it('reports progress while regeneration is in flight', async () => {
    wordPlots = [
      { id: 'a', model: makePlot('point') },
      { id: 'b', model: makePlot('axis') },
    ];

    const gate: (() => void)[] = [];
    generateSpy.mockImplementation(
      () =>
        new Promise(resolve => {
          gate.push(() => {
            resolve({
              base64: 'data:image/png;base64,fake',
              widthInPx: 100,
              heightInPx: 100,
              widthInPoints: 50,
              heightInPoints: 50,
            });
          });
        }),
    );

    solutionView.showSolution.set(true);
    TestBed.tick();
    await flushMicrotasks();

    expect(renderService.progress()).toEqual({ current: 0, total: 2 });

    gate[0]();
    await flushMicrotasks();
    expect(renderService.progress()).toEqual({ current: 1, total: 2 });

    gate[1]();
    await flushMicrotasks();
    expect(renderService.progress()).toBeNull();
  });

  it('clears progress even when generate returns an error code', async () => {
    wordPlots = [{ id: 'a', model: makePlot('point') }];
    generateSpy.mockImplementationOnce(() =>
      Promise.resolve(PlotGenerateErrorCode.evaluate),
    );
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();

    expect(renderService.progress()).toBeNull();
  });

  it('passes the current showSolution value to plotService.generate', async () => {
    wordPlots = [{ id: 'a', model: makePlot('point') }];
    solutionView.showSolution.set(true);
    await flushSignalAndAsync();
    expect(generateSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ showSolution: true }),
    );

    solutionView.showSolution.set(false);
    await flushSignalAndAsync();
    expect(generateSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ showSolution: false }),
    );
  });
});

async function flushMicrotasks(): Promise<void> {
  // regenerateReflectedPlots awaits list -> N×(generate + upsertPicture).
  // setTimeout(0) drains after all pending microtasks.
  await new Promise(resolve => setTimeout(resolve, 0));
  await new Promise(resolve => setTimeout(resolve, 0));
}
