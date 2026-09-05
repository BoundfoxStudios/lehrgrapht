import { Annotations } from 'plotly.js-dist-min';
import { Plot, PlotSettings } from '../../models/plot';
import { PlotAnnotationsService } from './plot-annotations.service';
import { AxisOrigin } from './plot-geometry';

type AnnotationValues = (number | string | undefined)[];

const plotSettings: PlotSettings = {
  zeroLineWidth: 1,
  zeroLineColor: '#000000',
  gridLineWidth: 0.5,
  gridLineColor: '#cccccc',
  plotLineWidth: 1.5,
  markerNamingScheme: 'alphabetic',
  legendLabelFormat: 'none',
};

const originAtZero: AxisOrigin = { x: 0, y: 0 };

const basePlot: Plot = {
  version: '1.0',
  name: 'test',
  range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
  unitsPerSquare: { x: 0.5, y: 0.5 },
  axisSnapping: { x: 'extend', y: 'extend' },
  fnx: [],
  markers: [],
  polygons: [],
  showAxisLabels: true,
  showAxis: true,
  placeAxisLabelsInside: false,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
  legendLabelFormat: 'none',
  showAxisArrows: false,
  gridStep: '1',
  reflection: { kind: 'none' },
};

describe('PlotAnnotationsService', () => {
  const service = new PlotAnnotationsService();

  const xLabelValues = (
    annotations: Partial<Annotations>[],
  ): AnnotationValues =>
    annotations
      .filter(a => a.showarrow === false && a.xanchor === 'center')
      .map(a => a.x);

  const yLabelValues = (
    annotations: Partial<Annotations>[],
  ): AnnotationValues =>
    annotations
      .filter(a => a.showarrow === false && a.xanchor === 'right')
      .map(a => a.y);

  const xTickLineValues = (
    annotations: Partial<Annotations>[],
  ): AnnotationValues =>
    annotations
      .filter(a => a.showarrow === true && a.xanchor === 'center')
      .map(a => a.x);

  const yTickLineValues = (
    annotations: Partial<Annotations>[],
  ): AnnotationValues =>
    annotations
      .filter(a => a.showarrow === true && a.xanchor === 'left')
      .map(a => a.y);

  describe('buildXLabels', () => {
    it('should label every given value', () => {
      const labels = service.buildXLabels([-2, -1, 0, 1, 2], originAtZero);
      expect(labels.map(l => l.x)).toEqual([-2, -1, 0, 1, 2]);
    });

    it('should shift label when x=0', () => {
      const labels = service.buildXLabels([-1, 0, 1], originAtZero);
      const zeroLabel = labels.find(l => l.x === 0);
      expect(zeroLabel?.xshift).toBe(6);
    });

    it('should not shift labels when x is not 0', () => {
      const labels = service.buildXLabels([-2, -1, 0, 1, 2], originAtZero);
      const nonZeroLabels = labels.filter(l => l.x !== 0);
      for (const label of nonZeroLabels) {
        expect(label.xshift).toBeUndefined();
      }
    });

    it('should write a negative value with the typographic minus sign', () => {
      expect(service.buildXLabels([-1.5], originAtZero)[0].text).toBe(
        '\u22121.5',
      );
    });

    it('should sit on the origin and shift the label standing on it', () => {
      const labels = service.buildXLabels([9, 10, 11], { x: 9, y: -4 });

      expect(labels.map(l => l.y)).toEqual([-4, -4, -4]);
      expect(labels.map(l => l.xshift)).toEqual([6, undefined, undefined]);
    });
  });

  describe('buildXTickLines', () => {
    it('should draw a tick on every value except zero', () => {
      const ticks = service.buildXTickLines(
        [-2, -1, 0, 1, 2],
        plotSettings,
        originAtZero,
      );
      expect(ticks.map(t => t.x)).toEqual([-2, -1, 1, 2]);
    });

    it('should set arrowwidth from plotSettings', () => {
      const ticks = service.buildXTickLines(
        [-1, 1],
        plotSettings,
        originAtZero,
      );
      for (const tick of ticks) {
        expect(tick.arrowwidth).toBe(plotSettings.zeroLineWidth);
      }
    });

    it('should sit on the origin and skip the tick standing on it', () => {
      const ticks = service.buildXTickLines([9, 10, 11], plotSettings, {
        x: 9,
        y: -4,
      });

      expect(ticks.map(t => t.x)).toEqual([10, 11]);
      expect(ticks.map(t => t.y)).toEqual([-4, -4]);
    });
  });

  describe('buildYLabels', () => {
    it('should label every given value', () => {
      const labels = service.buildYLabels([-2, -1, 0, 1, 2], originAtZero);
      expect(labels.map(l => l.y)).toEqual([-2, -1, 0, 1, 2]);
    });

    it('should write a negative value with the typographic minus sign', () => {
      expect(service.buildYLabels([-1.5], originAtZero)[0].text).toBe(
        '\u22121.5',
      );
    });

    it('should sit on the origin', () => {
      const labels = service.buildYLabels([9, 10], { x: -4, y: 9 });

      expect(labels.map(l => l.x)).toEqual([-4, -4]);
    });
  });

  describe('buildYTickLines', () => {
    it('should draw a tick on every value except zero', () => {
      const ticks = service.buildYTickLines(
        [-2, -1, 0, 1, 2],
        plotSettings,
        originAtZero,
      );
      expect(ticks.map(t => t.y)).toEqual([-2, -1, 1, 2]);
    });

    it('should sit on the origin and skip the tick standing on it', () => {
      const ticks = service.buildYTickLines([9, 10, 11], plotSettings, {
        x: -4,
        y: 9,
      });

      expect(ticks.map(t => t.y)).toEqual([10, 11]);
      expect(ticks.map(t => t.x)).toEqual([-4, -4]);
    });
  });

  describe('buildAnnotations', () => {
    it('should label the inner values and tick every value below the maximum', () => {
      const annotations = service.buildAnnotations(
        basePlot,
        plotSettings,
        originAtZero,
      );

      expect(xLabelValues(annotations)).toEqual([-2, -1, 0, 1, 2]);
      expect(xTickLineValues(annotations)).toEqual([-3, -2, -1, 1, 2]);
      expect(yTickLineValues(annotations)).toEqual([-3, -2, -1, 1, 2]);
    });

    it('should remove y=0 from y labels when x range includes 0', () => {
      const annotations = service.buildAnnotations(
        basePlot,
        plotSettings,
        originAtZero,
      );

      expect(yLabelValues(annotations)).toEqual([-2, -1, 1, 2]);
    });

    it('should anchor the values at zero instead of at the range start', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: 1.5, max: 7.5 }, y: { min: 1.5, max: 7.5 } },
      };

      const annotations = service.buildAnnotations(
        plot,
        plotSettings,
        originAtZero,
      );

      expect(xLabelValues(annotations)).toEqual([2, 3, 4, 5, 6, 7]);
      expect(yLabelValues(annotations)).toEqual([2, 3, 4, 5, 6, 7]);
    });

    it('should step by two squares on each axis when the scales differ', () => {
      const plot: Plot = {
        ...basePlot,
        unitsPerSquare: { x: 1, y: 20 },
        range: { x: { min: -6, max: 6 }, y: { min: -200, max: 200 } },
      };

      const annotations = service.buildAnnotations(
        plot,
        plotSettings,
        originAtZero,
      );

      expect(xLabelValues(annotations)).toEqual([-4, -2, 0, 2, 4]);
      expect(yLabelValues(annotations)).toEqual([
        -160, -120, -80, -40, 40, 80, 120, 160,
      ]);
    });

    it('should drop the double label and the ticks on a shifted origin', () => {
      const plot: Plot = {
        ...basePlot,
        range: { x: { min: 1.5, max: 7.5 }, y: { min: 1.5, max: 7.5 } },
      };

      const annotations = service.buildAnnotations(plot, plotSettings, {
        x: 2,
        y: 2,
      });

      expect(xLabelValues(annotations)).toEqual([2, 3, 4, 5, 6, 7]);
      expect(yLabelValues(annotations)).toEqual([3, 4, 5, 6, 7]);
      expect(xTickLineValues(annotations)).toEqual([3, 4, 5, 6, 7]);
      expect(yTickLineValues(annotations)).toEqual([3, 4, 5, 6, 7]);
    });
  });

  describe('buildArrows', () => {
    it('returns empty when neither arrows nor labels are enabled', () => {
      const plot: Plot = {
        ...basePlot,
        showAxisArrows: false,
        showAxisLabels: false,
      };
      expect(
        service.buildArrows(plot, plotSettings, 5, 5, originAtZero),
      ).toEqual([]);
    });

    it('returns labels only when showAxisArrows is false but showAxisLabels is true', () => {
      const plot: Plot = {
        ...basePlot,
        showAxisArrows: false,
        showAxisLabels: true,
      };
      const arrows = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );
      expect(arrows.length).toBe(2); // x-label + y-label, no arrow annotations
      expect(arrows.every(a => a.showarrow === false)).toBe(true);
    });

    it('returns arrows and labels when both are enabled', () => {
      const plot: Plot = {
        ...basePlot,
        showAxisArrows: true,
        showAxisLabels: true,
      };
      const arrows = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );
      expect(arrows.length).toBe(4); // 2 arrows + 2 labels
    });

    it('should create x and y axis arrows when showAxisArrows is true', () => {
      const plot: Plot = { ...basePlot, showAxisArrows: true };
      const arrows = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );
      expect(arrows.length).toBeGreaterThanOrEqual(2);
      expect(arrows[0].x).toBe(5);
      expect(arrows[0].y).toBe(0);
      expect(arrows[1].x).toBe(0);
      expect(arrows[1].y).toBe(5);
    });

    it('should use custom axis labels', () => {
      const plot: Plot = {
        ...basePlot,
        showAxisArrows: true,
        axisLabelX: 'Zeit',
        axisLabelY: 'Strecke',
      };
      const arrows = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );
      expect(arrows[2].text).toBe('Strecke');
      expect(arrows[3].text).toBe('Zeit');
    });

    it('should not add axis label annotations when showAxisLabels is false', () => {
      const plot: Plot = {
        ...basePlot,
        showAxisArrows: true,
        showAxisLabels: false,
      };
      const arrows = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );
      expect(arrows.length).toBe(2);
    });

    it('should use zeroLineColor for arrow color', () => {
      const plot: Plot = { ...basePlot, showAxisArrows: true };
      const arrows = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );
      expect(arrows[0].arrowcolor).toBe(plotSettings.zeroLineColor);
      expect(arrows[1].arrowcolor).toBe(plotSettings.zeroLineColor);
    });

    it('should keep the axis label offsets at a fixed fraction of a square', () => {
      const plot: Plot = {
        ...basePlot,
        unitsPerSquare: { x: 1, y: 20 },
        showAxisArrows: false,
        showAxisLabels: true,
      };
      const [yAxisLabel, xAxisLabel] = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        originAtZero,
      );

      expect(yAxisLabel.x).toBe(0.2);
      expect(xAxisLabel.y).toBe(22);
    });

    it('should place the arrows on a shifted origin', () => {
      const plot: Plot = {
        ...basePlot,
        showAxisArrows: true,
        showAxisLabels: false,
      };
      const [xArrow, yArrow] = service.buildArrows(plot, plotSettings, 20, 20, {
        x: 9,
        y: -4,
      });

      expect(xArrow.y).toBe(-4);
      expect(yArrow.x).toBe(9);
    });

    it('should add the axis label offsets onto a shifted origin', () => {
      const plot: Plot = {
        ...basePlot,
        unitsPerSquare: { x: 1, y: 20 },
        showAxisArrows: false,
        showAxisLabels: true,
      };
      const [yAxisLabel, xAxisLabel] = service.buildArrows(
        plot,
        plotSettings,
        5,
        5,
        { x: 9, y: -40 },
      );

      expect(yAxisLabel.x).toBe(9.2);
      expect(xAxisLabel.y).toBe(-18);
    });
  });
});
