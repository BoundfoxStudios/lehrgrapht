import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Plot, PlotSettings } from '../models/plot';
import { PlotService } from './plot/plot.service';
import { PlotGenerateErrorCode } from './plot/plot.types';
import {
  PlotSettingsService,
  defaultPlotSettings,
} from './plot-settings.service';
import { WordPlot, WordService } from './word/word.service';
import { SolutionViewService } from './solution-view.service';

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

describe('SolutionViewService', () => {
  let service: SolutionViewService;
  let wordPlots: WordPlot[];
  let generateSpy: ReturnType<typeof vi.fn<GenerateFn>>;
  let upsertSpy: ReturnType<typeof vi.fn<UpsertFn>>;

  beforeEach(() => {
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
    service = TestBed.inject(SolutionViewService);
  });

  it('defaults showSolution to false', () => {
    expect(service.showSolution()).toBe(false);
  });

  it('flips showSolution on each toggle', async () => {
    await service.toggle();
    expect(service.showSolution()).toBe(true);
    await service.toggle();
    expect(service.showSolution()).toBe(false);
  });

  it('regenerates only plots with reflection.kind !== "none"', async () => {
    wordPlots = [
      { id: 'a', model: makePlot('none') },
      { id: 'b', model: makePlot('point') },
      { id: 'c', model: makePlot('axis') },
    ];
    await service.toggle();
    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenCalledTimes(2);
  });

  it('skips plots without a model', async () => {
    wordPlots = [{ id: 'a' }];
    await service.toggle();
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
    await service.toggle();
    expect(generateSpy).toHaveBeenCalledTimes(2);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
  });

  it('passes the current showSolution value to plotService.generate', async () => {
    wordPlots = [{ id: 'a', model: makePlot('point') }];
    await service.toggle();
    expect(generateSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ showSolution: true }),
    );
    await service.toggle();
    expect(generateSpy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ showSolution: false }),
    );
  });
});
