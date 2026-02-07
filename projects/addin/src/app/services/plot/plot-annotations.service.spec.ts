import { Plot, PlotSettings } from '../../models/plot';
import { PlotAnnotationsService } from './plot-annotations.service';

const plotSettings: PlotSettings = {
  zeroLineWidth: 1,
  zeroLineColor: '#000000',
  gridLineWidth: 0.5,
  gridLineColor: '#cccccc',
  plotLineWidth: 1.5,
  markerNamingScheme: 'alphabetic',
};

const basePlot: Plot = {
  version: '1.0',
  name: 'test',
  range: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
  fnx: [],
  markers: [],
  areas: [],
  lines: [],
  showAxisLabels: true,
  showAxis: true,
  placeAxisLabelsInside: false,
  squarePlots: false,
  automaticallyAdjustLimitsToValueRange: false,
  axisLabelX: 'x',
  axisLabelY: 'y',
};

describe('PlotAnnotationsService', () => {
  const service = new PlotAnnotationsService();

  describe('buildXLabels', () => {
    it('should exclude first and last values (inner values only)', () => {
      const labels = service.buildXLabels([-3, -2, -1, 0, 1, 2, 3]);
      const xValues = labels.map(l => l.x);
      expect(xValues).toEqual([-2, -1, 0, 1, 2]);
    });

    it('should shift label when x=0', () => {
      const labels = service.buildXLabels([-1, 0, 1]);
      const zeroLabel = labels.find(l => l.x === 0);
      expect(zeroLabel?.xshift).toBe(6);
    });

    it('should not shift labels when x is not 0', () => {
      const labels = service.buildXLabels([-2, -1, 0, 1, 2]);
      const nonZeroLabels = labels.filter(l => l.x !== 0);
      for (const label of nonZeroLabels) {
        expect(label.xshift).toBeUndefined();
      }
    });

    it('should return empty array for range with only 2 values', () => {
      const labels = service.buildXLabels([-1, 1]);
      expect(labels.length).toBe(0);
    });
  });

  describe('buildXTickLines', () => {
    it('should exclude x=0', () => {
      const ticks = service.buildXTickLines([-2, -1, 0, 1, 2], plotSettings);
      const xValues = ticks.map(t => t.x);
      expect(xValues).not.toContain(0);
    });

    it('should exclude the last value', () => {
      const ticks = service.buildXTickLines([-2, -1, 0, 1, 2], plotSettings);
      const xValues = ticks.map(t => t.x);
      expect(xValues).not.toContain(2);
    });

    it('should set arrowwidth from plotSettings', () => {
      const ticks = service.buildXTickLines([-1, 1], plotSettings);
      for (const tick of ticks) {
        expect(tick.arrowwidth).toBe(plotSettings.zeroLineWidth);
      }
    });
  });

  describe('buildYLabels', () => {
    it('should exclude first and last values (inner values only)', () => {
      const labels = service.buildYLabels([-3, -2, -1, 0, 1, 2, 3]);
      const yValues = labels.map(l => l.y);
      expect(yValues).toEqual([-2, -1, 0, 1, 2]);
    });

    it('should return empty array for range with only 2 values', () => {
      const labels = service.buildYLabels([-1, 1]);
      expect(labels.length).toBe(0);
    });
  });

  describe('buildYTickLines', () => {
    it('should exclude y=0', () => {
      const ticks = service.buildYTickLines([-2, -1, 0, 1, 2], plotSettings);
      const yValues = ticks.map(t => t.y);
      expect(yValues).not.toContain(0);
    });

    it('should exclude the last value', () => {
      const ticks = service.buildYTickLines([-2, -1, 0, 1, 2], plotSettings);
      const yValues = ticks.map(t => t.y);
      expect(yValues).not.toContain(2);
    });
  });

  describe('buildAnnotations', () => {
    it('should combine x labels, x ticks, y labels, y ticks', () => {
      const annotations = service.buildAnnotations(basePlot, plotSettings);
      expect(annotations.length).toBeGreaterThan(0);
    });

    it('should remove y=0 from y labels when x range includes 0', () => {
      const annotations = service.buildAnnotations(basePlot, plotSettings);
      const yLabels = annotations.filter(a => a.xshift === -4);
      const yValues = yLabels.map(l => l.y);
      expect(yValues).not.toContain(0);
    });
  });

  describe('buildArrows', () => {
    it('should create x and y axis arrows', () => {
      const arrows = service.buildArrows(basePlot, plotSettings, 5, 5);
      expect(arrows.length).toBeGreaterThanOrEqual(2);
      expect(arrows[0].x).toBe(5);
      expect(arrows[0].y).toBe(0);
      expect(arrows[1].x).toBe(0);
      expect(arrows[1].y).toBe(5);
    });

    it('should add axis label annotations when showAxisLabels is true', () => {
      const arrows = service.buildArrows(basePlot, plotSettings, 5, 5);
      expect(arrows.length).toBe(4);
      expect(arrows[2].text).toBe('y');
      expect(arrows[3].text).toBe('x');
    });

    it('should use custom axis labels', () => {
      const plot: Plot = {
        ...basePlot,
        axisLabelX: 'Zeit',
        axisLabelY: 'Strecke',
      };
      const arrows = service.buildArrows(plot, plotSettings, 5, 5);
      expect(arrows[2].text).toBe('Strecke');
      expect(arrows[3].text).toBe('Zeit');
    });

    it('should not add axis label annotations when showAxisLabels is false', () => {
      const plot: Plot = { ...basePlot, showAxisLabels: false };
      const arrows = service.buildArrows(plot, plotSettings, 5, 5);
      expect(arrows.length).toBe(2);
    });

    it('should use zeroLineColor for arrow color', () => {
      const arrows = service.buildArrows(basePlot, plotSettings, 5, 5);
      expect(arrows[0].arrowcolor).toBe(plotSettings.zeroLineColor);
      expect(arrows[1].arrowcolor).toBe(plotSettings.zeroLineColor);
    });
  });
});
