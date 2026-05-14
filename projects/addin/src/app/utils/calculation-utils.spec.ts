import {
  calculateParabolaFunction,
  calculateStraightLineFunction,
} from './calculation-utils';

describe('calculateStraightLineFunction', () => {
  it('returns null for vertical line', () => {
    expect(
      calculateStraightLineFunction({ x: 1, y: 0 }, { x: 1, y: 5 }),
    ).toBeNull();
  });

  it('handles horizontal line (m === 0)', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 3 }, { x: 5, y: 3 })).toBe(
      '3',
    );
  });

  it('handles slope 1 with intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 1 }, { x: 1, y: 2 })).toBe(
      'x+1',
    );
  });

  it('handles slope -1 with no intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: 0 }, { x: 1, y: -1 })).toBe(
      '-x',
    );
  });

  it('handles generic slope and negative intercept', () => {
    expect(calculateStraightLineFunction({ x: 0, y: -2 }, { x: 1, y: 0 })).toBe(
      '2*x-2',
    );
  });
});

describe('calculateParabolaFunction', () => {
  it('returns null when two points share the same x', () => {
    expect(
      calculateParabolaFunction({ x: 1, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 5 }),
    ).toBeNull();
  });

  it('returns null when all three points share the same x', () => {
    expect(
      calculateParabolaFunction({ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }),
    ).toBeNull();
  });

  it('returns "x^2" for the unit parabola through (-1,1), (0,0), (1,1)', () => {
    expect(
      calculateParabolaFunction(
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ),
    ).toBe('x^2');
  });

  it('returns "-x^2" for the inverted unit parabola', () => {
    expect(
      calculateParabolaFunction(
        { x: -1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: -1 },
      ),
    ).toBe('-x^2');
  });

  it('formats general quadratic with all coefficients', () => {
    // y = 2x^2 - 4x + 3 through (0,3), (1,1), (2,3)
    expect(
      calculateParabolaFunction({ x: 0, y: 3 }, { x: 1, y: 1 }, { x: 2, y: 3 }),
    ).toBe('2*x^2-4*x+3');
  });

  it('omits the b-term when b rounds to 0', () => {
    // y = x^2 + 1 through (-1,2), (0,1), (1,2)
    expect(
      calculateParabolaFunction(
        { x: -1, y: 2 },
        { x: 0, y: 1 },
        { x: 1, y: 2 },
      ),
    ).toBe('x^2+1');
  });

  it('omits the c-term when c rounds to 0', () => {
    // y = x^2 + x through (-1,0), (0,0), (1,2)
    expect(
      calculateParabolaFunction(
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 2 },
      ),
    ).toBe('x^2+x');
  });

  it('falls back to a line when three points are collinear (a rounds to 0)', () => {
    // y = x through (0,0), (1,1), (2,2)
    expect(
      calculateParabolaFunction({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }),
    ).toBe('x');
  });

  it('returns constant string when all three y are equal', () => {
    expect(
      calculateParabolaFunction(
        { x: -1, y: 4 },
        { x: 0, y: 4 },
        { x: 1, y: 4 },
      ),
    ).toBe('4');
  });

  it('handles negative intercept', () => {
    // y = x^2 - 2 through (-1,-1), (0,-2), (1,-1)
    expect(
      calculateParabolaFunction(
        { x: -1, y: -1 },
        { x: 0, y: -2 },
        { x: 1, y: -1 },
      ),
    ).toBe('x^2-2');
  });
});
