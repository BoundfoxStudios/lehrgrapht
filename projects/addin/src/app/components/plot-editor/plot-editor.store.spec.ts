import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FieldTree } from '@angular/forms/signals';
import {
  isPolygonClosingClick,
  karopapierPlot,
  PlotEditorStore,
  withoutFunctionLegends,
} from './plot-editor.store';
import { InteractiveMode } from './interactive-mode';
import { dedupePolygonPoints } from './interactive-strategy';
import { PlotSettings } from '../../models/plot';
import { PlotRange } from '../../models/plot-range';
import { WordPlotService } from '../../services/office/plot/word-plot.service';
import { NoOpWordPlotService } from '../../services/office/plot/no-op-word-plot.service';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';

describe('karopapierPlot', () => {
  it('switches every Darstellung toggle off', () => {
    const plot = karopapierPlot();

    expect(plot.showAxis).toBe(false);
    expect(plot.showAxisLabels).toBe(false);
    expect(plot.showAxisArrows).toBe(false);
    expect(plot.placeAxisLabelsInside).toBe(false);
    expect(plot.legendLabelFormat).toBe('none');
  });

  it('names the plot Karopapier', () => {
    expect(karopapierPlot().name).toBe('Karopapier');
  });
});

describe('isPolygonClosingClick', () => {
  it('returns false when mode is not Polygon', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Marker,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        { x: 0, y: 0 },
      ),
    ).toBe(false);
  });

  it('returns false when fewer than 3 points have been placed', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        { x: 0, y: 0 },
      ),
    ).toBe(false);
  });

  it('returns false when there are no points yet', () => {
    expect(
      isPolygonClosingClick(InteractiveMode.Polygon, [], { x: 0, y: 0 }),
    ).toBe(false);
  });

  it('returns false when the click does not match the start point', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        { x: 1, y: 1 },
      ),
    ).toBe(false);
  });

  it('returns true when 3 points placed and click matches the start point', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
          { x: 2, y: 0 },
        ],
        { x: 0.5, y: 0.5 },
      ),
    ).toBe(true);
  });

  it('returns true when more than 3 points placed and click matches the start point', () => {
    expect(
      isPolygonClosingClick(
        InteractiveMode.Polygon,
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0.5, y: 1.5 },
          { x: 0, y: 1 },
        ],
        { x: 0, y: 0 },
      ),
    ).toBe(true);
  });
});

describe('dedupePolygonPoints', () => {
  it('returns input unchanged when there is no redundancy', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 5 },
    ];
    expect(dedupePolygonPoints(input)).toEqual(input);
  });

  it('removes a consecutive duplicate', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });

  it('removes multiple consecutive duplicates in a row', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ]);
  });

  it('keeps non-consecutive duplicates (self-intersection)', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 5 },
    ];
    expect(dedupePolygonPoints(input)).toEqual(input);
  });

  it('removes a collinear middle point on a segment', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('removes all collinear middles on a shared axis', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('keeps a zigzag point (collinear but outside the segment)', () => {
    const input = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
    ];
    expect(dedupePolygonPoints(input)).toEqual(input);
  });

  it('combines duplicate and collinear removal in the correct order', () => {
    const result = dedupePolygonPoints([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
    ]);
  });

  it('returns a single point when input contains only one point', () => {
    expect(dedupePolygonPoints([{ x: 3, y: 3 }])).toEqual([{ x: 3, y: 3 }]);
  });

  it('returns a single point when all points are duplicates', () => {
    expect(
      dedupePolygonPoints([
        { x: 3, y: 3 },
        { x: 3, y: 3 },
      ]),
    ).toEqual([{ x: 3, y: 3 }]);
  });

  it('returns an empty array for empty input', () => {
    expect(dedupePolygonPoints([])).toEqual([]);
  });
});

describe('withoutFunctionLegends', () => {
  it('sets legendPosition to none on every function', () => {
    const result = withoutFunctionLegends({
      ...karopapierPlot(),
      fnx: [
        {
          fnx: 'x^2',
          color: '#ff0000',
          legendPosition: 'start',
          lineStyle: 'solid',
        },
        {
          fnx: '2*x',
          color: '#00ff00',
          legendPosition: 'end',
          lineStyle: 'dashed',
        },
      ],
    });

    expect(result.fnx.map(fn => fn.legendPosition)).toEqual(['none', 'none']);
  });

  it('leaves everything but the legend position untouched', () => {
    const result = withoutFunctionLegends({
      ...karopapierPlot(),
      name: 'Parabel',
      fnx: [
        {
          fnx: 'x^2',
          color: '#ff0000',
          legendPosition: 'start',
          lineStyle: 'solid',
        },
      ],
    });

    expect(result.name).toBe('Parabel');
    expect(result.fnx[0].fnx).toBe('x^2');
    expect(result.fnx[0].color).toBe('#ff0000');
    expect(result.fnx[0].lineStyle).toBe('solid');
  });
});

describe('PlotEditorStore', () => {
  // A cleared <input type="number"> makes Signal Forms write null into the number model
  const emptiedNumberInput = null as unknown as number;

  let store: InstanceType<typeof PlotEditorStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PlotEditorStore,
        provideRouter([]),
        { provide: WordPlotService, useClass: NoOpWordPlotService },
        {
          provide: PlotSettingsService,
          useValue: { get: (): PlotSettings => defaultPlotSettings },
        },
      ],
    });
    store = TestBed.inject(PlotEditorStore);
  });

  it.each([
    {
      label: 'X Min',
      bound: (range: FieldTree<PlotRange>): FieldTree<number> => range.x.min,
      message: 'X Min darf nicht leer sein',
    },
    {
      label: 'X Max',
      bound: (range: FieldTree<PlotRange>): FieldTree<number> => range.x.max,
      message: 'X Max darf nicht leer sein',
    },
    {
      label: 'Y Min',
      bound: (range: FieldTree<PlotRange>): FieldTree<number> => range.y.min,
      message: 'Y Min darf nicht leer sein',
    },
    {
      label: 'Y Max',
      bound: (range: FieldTree<PlotRange>): FieldTree<number> => range.y.max,
      message: 'Y Max darf nicht leer sein',
    },
  ])(
    'reports only the required error and invalidates the form when $label is cleared',
    ({ bound, message }): void => {
      const field = bound(store.editorForm.range);

      field().controlValue.set(emptiedNumberInput);

      expect(
        field()
          .errors()
          .map(error => error.message),
      ).toEqual([message]);
      expect(store.editorForm().invalid()).toBe(true);
    },
  );

  it('reports the lessThan error when X Min is not smaller than X Max', () => {
    store.editorForm.range.x.min().controlValue.set(5);

    expect(
      store.editorForm.range.x
        .min()
        .errors()
        .map(error => error.message),
    ).toEqual(['X Min muss kleiner sein als X Max']);
  });

  it('reports no lessThan error on X Min when X Max is cleared and X Min is positive', () => {
    store.editorForm.range.x.min().controlValue.set(1);
    store.editorForm.range.x.max().controlValue.set(emptiedNumberInput);

    expect(store.editorForm.range.x.min().errors()).toEqual([]);
  });

  it('reports no lessThan error on a cleared X Min when X Max is negative', () => {
    store.editorForm.range.x.max().controlValue.set(-1);
    store.editorForm.range.x.min().controlValue.set(emptiedNumberInput);

    expect(
      store.editorForm.range.x
        .min()
        .errors()
        .map(error => error.kind),
    ).toEqual(['required']);
  });
});
