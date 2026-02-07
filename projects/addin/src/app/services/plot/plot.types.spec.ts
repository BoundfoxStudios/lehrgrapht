import {
  hexToRgba,
  plotHasErrorCode,
  PlotGenerateErrorCode,
} from './plot.types';

describe('plotHasErrorCode', () => {
  it('should return true for PlotGenerateErrorCode.compile', () => {
    expect(plotHasErrorCode(PlotGenerateErrorCode.compile)).toBe(true);
  });

  it('should return true for PlotGenerateErrorCode.evaluate', () => {
    expect(plotHasErrorCode(PlotGenerateErrorCode.evaluate)).toBe(true);
  });

  it('should return true for PlotGenerateErrorCode.plot', () => {
    expect(plotHasErrorCode(PlotGenerateErrorCode.plot)).toBe(true);
  });

  it('should return false for a string', () => {
    expect(plotHasErrorCode('hello')).toBe(false);
  });

  it('should return false for null', () => {
    expect(plotHasErrorCode(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(plotHasErrorCode(undefined)).toBe(false);
  });

  it('should return false for an object', () => {
    expect(plotHasErrorCode({ base64: 'abc' })).toBe(false);
  });
});

describe('hexToRgba', () => {
  it('should convert a valid hex color to rgba', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
  });

  it('should convert hex without # prefix', () => {
    expect(hexToRgba('00ff00', 1)).toBe('rgba(0, 255, 0, 1)');
  });

  it('should handle black color', () => {
    expect(hexToRgba('#000000', 0.7)).toBe('rgba(0, 0, 0, 0.7)');
  });

  it('should handle white color', () => {
    expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('should return the input string for invalid hex', () => {
    expect(hexToRgba('not-a-color', 0.5)).toBe('not-a-color');
  });

  it('should return the input string for a short hex', () => {
    expect(hexToRgba('#fff', 0.5)).toBe('#fff');
  });
});
