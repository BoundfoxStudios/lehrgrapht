import { math } from './math';

describe('math', () => {
  it('evaluates ln as the natural logarithm', () => {
    const value: unknown = math.evaluate('ln(e)');
    expect(value).toBeCloseTo(1);
  });

  it('evaluates lg as the base-10 logarithm', () => {
    const value: unknown = math.evaluate('lg(1000)');
    expect(value).toBeCloseTo(3);
  });

  it('renders ln and lg under their own names in TeX', () => {
    expect(math.parse('ln(x)').toTex()).toMatch(/^\\ln\\left\(\s*x\\right\)$/);
    expect(math.parse('lg(x)').toTex()).toMatch(/^\\lg\\left\(\s*x\\right\)$/);
  });

  it.each(['ln', 'lg'])('rejects a base argument for %s', (name): void => {
    expect(() => {
      math.evaluate(`${name}(8, 2)`);
    }).toThrow(/Too many arguments/);
  });
});
