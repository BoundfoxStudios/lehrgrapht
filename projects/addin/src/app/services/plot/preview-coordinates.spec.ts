import { PLOT_CONSTANTS, PlotMarginMm } from './plot.types';
import {
  PreviewCoordinates,
  PreviewGeometry,
  PreviewPointer,
  previewPointToPlotCoordinates,
} from './preview-coordinates';

describe('previewPointToPlotCoordinates', () => {
  const squaresPerAxis = 12;
  const plotAreaMm = squaresPerAxis * PLOT_CONSTANTS.mmPerSquare;
  const pixelsPerMm = { x: 4, y: 3 };
  const symmetricMargin: PlotMarginMm = { t: 7.5, b: 7.5, l: 7.5, r: 7.5 };
  const endLegendMargin: PlotMarginMm = { t: 7.5, b: 7.5, l: 7.5, r: 33.07 };
  const startLegendMargin: PlotMarginMm = { t: 7.5, b: 7.5, l: 33.07, r: 7.5 };

  const geometry = (margin: PlotMarginMm): PreviewGeometry => ({
    squares: { x: squaresPerAxis, y: squaresPerAxis },
    drawnRange: { x: { min: -3, max: 3 }, y: { min: -3, max: 3 } },
    unitsPerSquare: { x: 0.5, y: 0.5 },
    margin,
  });

  const pointerAtPlotAreaFraction = (
    margin: PlotMarginMm,
    fractionX: number,
    fractionY: number,
  ): PreviewPointer => ({
    x: (margin.l + fractionX * plotAreaMm) * pixelsPerMm.x,
    y: (margin.t + (1 - fractionY) * plotAreaMm) * pixelsPerMm.y,
    imageWidth: (plotAreaMm + margin.l + margin.r) * pixelsPerMm.x,
    imageHeight: (plotAreaMm + margin.t + margin.b) * pixelsPerMm.y,
  });

  const coordinatesInsidePlotArea = (
    previewGeometry: PreviewGeometry,
    pointer: PreviewPointer,
  ): PreviewCoordinates => {
    const coordinates = previewPointToPlotCoordinates(previewGeometry, pointer);
    if (!coordinates) {
      throw new Error('expected the pointer to be inside the plot area');
    }
    return coordinates;
  };

  it('maps the plot area centre to the axis centre when an end legend widens the right margin', () => {
    const coordinates = coordinatesInsidePlotArea(
      geometry(endLegendMargin),
      pointerAtPlotAreaFraction(endLegendMargin, 0.5, 0.5),
    );

    expect(coordinates.x).toBe(0);
    expect(coordinates.y).toBe(0);
  });

  it('maps the plot area centre to the axis centre when a start legend widens the left margin', () => {
    const coordinates = coordinatesInsidePlotArea(
      geometry(startLegendMargin),
      pointerAtPlotAreaFraction(startLegendMargin, 0.5, 0.5),
    );

    expect(coordinates.x).toBe(0);
    expect(coordinates.y).toBe(0);
  });

  it('maps the plot area edges to the drawn axis minimum and maximum for an asymmetric margin', () => {
    const left = coordinatesInsidePlotArea(
      geometry(startLegendMargin),
      pointerAtPlotAreaFraction(startLegendMargin, 0, 0.5),
    );
    const right = coordinatesInsidePlotArea(
      geometry(startLegendMargin),
      pointerAtPlotAreaFraction(startLegendMargin, 1, 0.5),
    );

    expect(left.x).toBe(-3);
    expect(right.x).toBe(3);
  });

  it('maps the image centre to the axis centre for a symmetric margin', () => {
    const coordinates = coordinatesInsidePlotArea(
      geometry(symmetricMargin),
      pointerAtPlotAreaFraction(symmetricMargin, 0.5, 0.5),
    );

    expect(coordinates.x).toBe(0);
    expect(coordinates.y).toBe(0);
  });

  it('returns null for a pointer inside the widened legend margin', () => {
    const pointer = pointerAtPlotAreaFraction(endLegendMargin, 0.5, 0.5);

    expect(
      previewPointToPlotCoordinates(geometry(endLegendMargin), {
        ...pointer,
        x: (endLegendMargin.l + plotAreaMm + 10) * pixelsPerMm.x,
      }),
    ).toBeNull();
  });

  it('returns null for a pointer above the plot area', () => {
    const pointer = pointerAtPlotAreaFraction(endLegendMargin, 0.5, 0.5);

    expect(
      previewPointToPlotCoordinates(geometry(endLegendMargin), {
        ...pointer,
        y: (endLegendMargin.t / 2) * pixelsPerMm.y,
      }),
    ).toBeNull();
  });

  it('returns percentages that map back to the same point for an asymmetric margin', () => {
    const pointer = pointerAtPlotAreaFraction(endLegendMargin, 0.75, 0.75);
    const coordinates = coordinatesInsidePlotArea(
      geometry(endLegendMargin),
      pointer,
    );

    const roundTrip = coordinatesInsidePlotArea(geometry(endLegendMargin), {
      ...pointer,
      x: (coordinates.percentX / 100) * pointer.imageWidth,
      y: (coordinates.percentY / 100) * pointer.imageHeight,
    });

    expect(roundTrip.x).toBe(coordinates.x);
    expect(roundTrip.y).toBe(coordinates.y);
  });

  it('snaps a pointer between two grid points to the nearest grid point', () => {
    const coordinates = coordinatesInsidePlotArea(
      geometry(endLegendMargin),
      pointerAtPlotAreaFraction(endLegendMargin, 0.57, 0.68),
    );

    expect(coordinates.x).toBe(0.5);
    expect(coordinates.y).toBe(1);
  });
});
