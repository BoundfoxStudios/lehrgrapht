import { TestBed } from '@angular/core/testing';
import { SolutionRibbonService } from './solution-ribbon.service';
import { SolutionViewService } from './solution-view.service';

type RequestUpdateFn = (data: unknown) => Promise<void>;

describe('SolutionRibbonService', () => {
  let solutionView: SolutionViewService;
  let requestUpdateSpy: ReturnType<typeof vi.fn<RequestUpdateFn>>;
  let originalOffice: typeof Office | undefined;

  beforeEach(async () => {
    requestUpdateSpy = vi.fn<RequestUpdateFn>(() => Promise.resolve());
    originalOffice = (globalThis as { Office?: typeof Office }).Office;
    (globalThis as { Office?: unknown }).Office = {
      ribbon: { requestUpdate: requestUpdateSpy },
    };

    TestBed.configureTestingModule({});
    TestBed.inject(SolutionRibbonService);
    solutionView = TestBed.inject(SolutionViewService);
    TestBed.tick();
    await flushMicrotasks();
  });

  afterEach(() => {
    if (originalOffice === undefined) {
      delete (globalThis as { Office?: unknown }).Office;
    } else {
      (globalThis as { Office?: typeof Office }).Office = originalOffice;
    }
  });

  it('requests an update on initial value with ShowSolutionButton visible', () => {
    expect(requestUpdateSpy).toHaveBeenCalledTimes(1);
    expect(requestUpdateSpy).toHaveBeenLastCalledWith({
      tabs: [
        {
          id: 'TabHome',
          groups: [
            {
              id: 'CommandsGroup',
              controls: [
                { id: 'ShowSolutionButton', enabled: true },
                { id: 'HideSolutionButton', enabled: false },
              ],
            },
          ],
        },
      ],
    });
  });

  it('flips button visibility when showSolution flips', async () => {
    solutionView.showSolution.set(true);
    TestBed.tick();
    await flushMicrotasks();

    expect(requestUpdateSpy).toHaveBeenLastCalledWith({
      tabs: [
        {
          id: 'TabHome',
          groups: [
            {
              id: 'CommandsGroup',
              controls: [
                { id: 'ShowSolutionButton', enabled: false },
                { id: 'HideSolutionButton', enabled: true },
              ],
            },
          ],
        },
      ],
    });

    solutionView.showSolution.set(false);
    TestBed.tick();
    await flushMicrotasks();

    expect(requestUpdateSpy).toHaveBeenLastCalledWith({
      tabs: [
        {
          id: 'TabHome',
          groups: [
            {
              id: 'CommandsGroup',
              controls: [
                { id: 'ShowSolutionButton', enabled: true },
                { id: 'HideSolutionButton', enabled: false },
              ],
            },
          ],
        },
      ],
    });
  });
});

async function flushMicrotasks(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}
