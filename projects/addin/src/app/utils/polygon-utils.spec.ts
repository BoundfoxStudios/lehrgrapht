import { MarkerNamingService } from '../services/marker-naming.service';
import { Polygon } from '../models/plot';
import { applyAutoLabelToPolygon } from './polygon-utils';

describe('applyAutoLabelToPolygon', () => {
  const namer = new MarkerNamingService();

  const polygonWithEmptyLabels = (): Polygon => ({
    points: [
      { x: 0, y: 0, labelPosition: 'auto', labelText: '' },
      { x: 1, y: 1, labelPosition: 'top right', labelText: '' },
      { x: 2, y: 2, labelPosition: 'auto', labelText: '   ' },
    ],
    connect: true,
    lineColor: '#000',
    fillColor: null,
    lineStyle: 'solid',
    showPoints: true,
    fillStyle: 'solid',
    isSolution: false,
  });

  it('labels all points when none have a label', () => {
    const result = applyAutoLabelToPolygon(
      polygonWithEmptyLabels(),
      'alphabetic',
      namer,
      0,
    );
    expect(result.points.map(p => p.labelText)).toEqual(['A', 'B', 'C']);
  });

  it('preserves labelPosition of each point', () => {
    const result = applyAutoLabelToPolygon(
      polygonWithEmptyLabels(),
      'alphabetic',
      namer,
      0,
    );
    expect(result.points.map(p => p.labelPosition)).toEqual([
      'auto',
      'top right',
      'auto',
    ]);
  });

  it('returns the polygon unchanged when at least one point already has a non-empty label', () => {
    const polygon = polygonWithEmptyLabels();
    polygon.points[1] = { ...polygon.points[1], labelText: 'X' };
    const result = applyAutoLabelToPolygon(polygon, 'alphabetic', namer, 0);
    expect(result).toBe(polygon);
  });

  it('treats whitespace-only labels as empty', () => {
    const polygon = polygonWithEmptyLabels();
    polygon.points[0] = { ...polygon.points[0], labelText: '  ' };
    const result = applyAutoLabelToPolygon(polygon, 'alphabetic', namer, 0);
    expect(result.points.map(p => p.labelText)).toEqual(['A', 'B', 'C']);
  });

  it('applies startIndex offset and respects the numeric scheme', () => {
    const result = applyAutoLabelToPolygon(
      polygonWithEmptyLabels(),
      'numeric',
      namer,
      3,
    );
    expect(result.points.map(p => p.labelText)).toEqual(['P4', 'P5', 'P6']);
  });

  it('does not mutate the input polygon', () => {
    const polygon = polygonWithEmptyLabels();
    const before = JSON.stringify(polygon);
    applyAutoLabelToPolygon(polygon, 'alphabetic', namer, 0);
    expect(JSON.stringify(polygon)).toBe(before);
  });
});
