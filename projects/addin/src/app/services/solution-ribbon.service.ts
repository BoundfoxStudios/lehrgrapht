import { Injectable, effect, inject } from '@angular/core';
import { SolutionViewService } from './solution-view.service';

@Injectable({ providedIn: 'root' })
export class SolutionRibbonService {
  private readonly solutionViewService = inject(SolutionViewService);

  constructor() {
    effect(() => {
      const showSolution = this.solutionViewService.showSolution();
      if (typeof Office === 'undefined') return;
      void Office.ribbon.requestUpdate({
        tabs: [
          {
            id: 'TabHome',
            groups: [
              {
                id: 'CommandsGroup',
                controls: [
                  { id: 'ShowSolutionButton', enabled: !showSolution },
                  { id: 'HideSolutionButton', enabled: showSolution },
                ],
              },
            ],
          },
        ],
      });
    });
  }
}
