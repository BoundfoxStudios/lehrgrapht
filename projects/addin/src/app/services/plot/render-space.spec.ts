import { PlotTrace, toRenderAnnotations, toRenderTraces } from './render-space';

describe('toRenderTraces', () => {
  it('should scale each axis with its own factor', () => {
    const traces: PlotTrace[] = [{ x: [0, 2, 4], y: [0, 100, 200] }];

    expect(toRenderTraces(traces, { x: 0.5, y: 0.025 })).toEqual([
      { x: [0, 1, 2], y: [0, 2.5, 5] },
    ]);
  });

  it('should keep the gaps of a pole', () => {
    const traces: PlotTrace[] = [{ x: [1, 2, 3], y: [1, null, 3] }];

    expect(toRenderTraces(traces, { x: 1, y: 2 })[0].y).toEqual([2, null, 6]);
  });

  it('should leave every field besides the coordinates alone', () => {
    const traces: PlotTrace[] = [
      {
        type: 'scatter',
        mode: 'lines',
        x: [1],
        y: [1],
        line: { color: '#ff0000', width: 2, dash: 'dash' },
      },
    ];

    const [rendered] = toRenderTraces(traces, { x: 2, y: 2 });

    expect(rendered.type).toBe('scatter');
    expect(rendered.mode).toBe('lines');
    expect(rendered.line).toEqual({ color: '#ff0000', width: 2, dash: 'dash' });
  });
});

describe('toRenderAnnotations', () => {
  it('should scale only the coordinates that reference an axis', () => {
    const annotations = [
      { x: 4, y: 100, xref: 'x' as const, yref: 'y' as const },
    ];

    expect(toRenderAnnotations(annotations, { x: 0.5, y: 0.025 })).toEqual([
      { x: 2, y: 2.5, xref: 'x', yref: 'y' },
    ]);
  });

  it('should leave a paper reference untouched', () => {
    const annotations = [
      { x: 0.5, y: 1.01, xref: 'paper' as const, yref: 'paper' as const },
      { x: 4, y: 1.01, xref: 'x' as const, yref: 'paper' as const },
    ];

    expect(toRenderAnnotations(annotations, { x: 0.5, y: 0.025 })).toEqual([
      { x: 0.5, y: 1.01, xref: 'paper', yref: 'paper' },
      { x: 2, y: 1.01, xref: 'x', yref: 'paper' },
    ]);
  });

  it('should leave the pixel offsets untouched', () => {
    const annotations = [
      {
        x: 4,
        y: 4,
        xref: 'x' as const,
        yref: 'y' as const,
        ax: 20,
        ay: -20,
        xshift: 6,
        yshift: -2,
      },
    ];

    const [rendered] = toRenderAnnotations(annotations, { x: 0.5, y: 0.025 });

    expect(rendered.ax).toBe(20);
    expect(rendered.ay).toBe(-20);
    expect(rendered.xshift).toBe(6);
    expect(rendered.yshift).toBe(-2);
  });
});
