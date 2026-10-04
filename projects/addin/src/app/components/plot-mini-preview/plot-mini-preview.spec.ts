import { Component, ErrorHandler, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Plot, PlotSettings } from '../../models/plot';
import {
  defaultPlotSettings,
  PlotSettingsService,
} from '../../services/plot-settings.service';
import { PlotService } from '../../services/plot/plot.service';
import { karopapierPlot } from '../plot-editor/plot-editor.store';
import { PlotMiniPreview } from './plot-mini-preview';

@Component({
  template: `<lg-plot-mini-preview [plot]="plot()" />`,
  imports: [PlotMiniPreview],
})
class Host {
  readonly plot = signal<Plot>(karopapierPlot());
}

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  fixture.detectChanges();
  await new Promise(resolve => setTimeout(resolve, 0));
  await fixture.whenStable();
}

describe('PlotMiniPreview', () => {
  it('renders the next plot after generating the previous one threw', async () => {
    const generate = vi
      .fn<PlotService['generate']>()
      .mockRejectedValueOnce(new Error('range cannot be built'))
      .mockResolvedValue({
        base64: 'data:image/png;base64,rendered',
        widthInPx: 100,
        heightInPx: 100,
        widthInPoints: 50,
        heightInPoints: 50,
        marginMm: { t: 5, b: 5, l: 5, r: 5 },
      });
    TestBed.configureTestingModule({
      providers: [
        { provide: PlotService, useValue: { generate } },
        {
          provide: PlotSettingsService,
          useValue: { get: (): PlotSettings => defaultPlotSettings },
        },
        { provide: ErrorHandler, useValue: { handleError: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(Host);
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('img')).toBeNull();

    fixture.componentInstance.plot.set({ ...karopapierPlot(), name: 'Gültig' });
    await settle(fixture);

    expect(host.querySelector('img')?.getAttribute('src')).toBe(
      'data:image/png;base64,rendered',
    );
  });
});
