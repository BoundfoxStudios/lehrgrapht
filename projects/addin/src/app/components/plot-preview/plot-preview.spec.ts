import { Component, ErrorHandler, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Plot } from '../../models/plot';
import { defaultPlotSettings } from '../../services/plot-settings.service';
import { PlotService } from '../../services/plot/plot.service';
import { karopapierPlot } from '../plot-editor/plot-editor.store';
import { PlotPreview } from './plot-preview';

@Component({
  template: `<lg-plot-preview
    [plot]="plot()"
    [plotSettings]="plotSettings"
  />`,
  imports: [PlotPreview],
})
class Host {
  readonly plot = signal<Plot>(karopapierPlot());
  readonly plotSettings = defaultPlotSettings;
}

const renderedPreview = {
  base64: 'data:image/png;base64,rendered',
  widthInPx: 100,
  heightInPx: 100,
  widthInPoints: 50,
  heightInPoints: 50,
  marginMm: { t: 5, b: 5, l: 5, r: 5 },
};

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  fixture.detectChanges();
  await new Promise(resolve => setTimeout(resolve, 0));
  await fixture.whenStable();
}

describe('PlotPreview', () => {
  const generationFailure = new Error('range cannot be built');
  let fixture: ComponentFixture<Host>;
  let generate: ReturnType<typeof vi.fn<PlotService['generate']>>;
  let handleError: ReturnType<typeof vi.fn<ErrorHandler['handleError']>>;

  beforeEach(async () => {
    generate = vi
      .fn<PlotService['generate']>()
      .mockRejectedValueOnce(generationFailure)
      .mockResolvedValue(renderedPreview);
    handleError = vi.fn<ErrorHandler['handleError']>();

    TestBed.configureTestingModule({
      providers: [
        { provide: PlotService, useValue: { generate } },
        { provide: ErrorHandler, useValue: { handleError } },
      ],
    });
    fixture = TestBed.createComponent(Host);
    await settle(fixture);
  });

  it('shows the unknown error message and reports the error when generating the preview throws', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain(
      'Der Plot kann aufgrund eines unbekannten Fehlers nicht generiert werden.',
    );
    expect(handleError).toHaveBeenCalledWith(generationFailure);
  });

  it('renders the preview of the next plot after generating the previous one threw', async () => {
    fixture.componentInstance.plot.set({ ...karopapierPlot(), name: 'Gültig' });
    await settle(fixture);

    const image = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(generate).toHaveBeenCalledTimes(2);
    expect(image?.getAttribute('src')).toBe(renderedPreview.base64);
  });
});
