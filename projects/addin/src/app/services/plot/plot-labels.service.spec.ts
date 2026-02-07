import { PlotMarginMm, PlotSizeCalculation } from './plot.types';
import { PlotLabelsService } from './plot-labels.service';

describe('PlotLabelsService', () => {
  const service = new PlotLabelsService();

  describe('findLabelPosition', () => {
    it('should find the first visible point from start', () => {
      const xValues = [0, 1, 2, 3, 4];
      const yValues = [0, 1, 2, 3, 4];
      const result = service.findLabelPosition(xValues, yValues, 0, 4, true);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should find the last visible point from end', () => {
      const xValues = [0, 1, 2, 3, 4];
      const yValues = [0, 1, 2, 3, 4];
      const result = service.findLabelPosition(xValues, yValues, 0, 4, false);
      expect(result).toEqual({ x: 4, y: 4 });
    });

    it('should return undefined when no visible points exist', () => {
      const xValues = [0, 1, 2];
      const yValues = [10, 11, 12];
      const result = service.findLabelPosition(xValues, yValues, 0, 5, true);
      expect(result).toBeUndefined();
    });

    it('should interpolate boundary crossing from start', () => {
      const xValues = [0, 1, 2];
      const yValues = [-10, 0, 5];
      const result = service.findLabelPosition(xValues, yValues, -5, 5, true);
      expect(result).toEqual({ x: 0.5, y: -5 });
    });

    it('should interpolate boundary crossing from end', () => {
      const xValues = [0, 1, 2];
      const yValues = [0, 5, 10];
      const result = service.findLabelPosition(xValues, yValues, -5, 5, false);
      expect(result).toEqual({ x: 1, y: 5 });
    });

    it('should handle NaN/Infinity values', () => {
      const xValues = [0, 1, 2, 3];
      const yValues = [NaN, Infinity, 2, 3];
      const result = service.findLabelPosition(xValues, yValues, 0, 5, true);
      expect(result).toEqual({ x: 2, y: 2 });
    });

    it('should return edge point when no adjacent out-of-range point', () => {
      const xValues = [0, 1, 2];
      const yValues = [1, 2, 3];
      const result = service.findLabelPosition(xValues, yValues, 0, 5, true);
      expect(result).toEqual({ x: 0, y: 1 });
    });
  });

  describe('calculateLabelImageCoordinates', () => {
    const margin: PlotMarginMm = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };

    const sizeCalc: PlotSizeCalculation = {
      xValueMin: -5,
      xValueMax: 5,
      yValueMin: -5,
      yValueMax: 5,
      plotSizePx: { width: 200, height: 200 },
      plotSizePoints: { width: 150, height: 150 },
    };

    it('should place label to the left of position when fromStart', () => {
      const coords = service.calculateLabelImageCoordinates(
        { x: 0, y: 0 },
        20,
        10,
        sizeCalc,
        margin,
        true,
      );
      expect(coords.xanchor).toBe('right');
      expect(coords.x).toBeLessThan(0.5);
    });

    it('should place label to the right of position when not fromStart', () => {
      const coords = service.calculateLabelImageCoordinates(
        { x: 0, y: 0 },
        20,
        10,
        sizeCalc,
        margin,
        false,
      );
      expect(coords.xanchor).toBe('left');
      expect(coords.x).toBeGreaterThan(0.5);
    });

    it('should compute positive sizex and sizey', () => {
      const coords = service.calculateLabelImageCoordinates(
        { x: 2, y: 3 },
        30,
        15,
        sizeCalc,
        margin,
        false,
      );
      expect(coords.sizex).toBeGreaterThan(0);
      expect(coords.sizey).toBeGreaterThan(0);
    });

    it('should shift y upward by gap', () => {
      const coords = service.calculateLabelImageCoordinates(
        { x: 0, y: 0 },
        20,
        10,
        sizeCalc,
        margin,
        false,
      );
      expect(coords.y).toBeGreaterThan(0.5);
    });
  });
});
