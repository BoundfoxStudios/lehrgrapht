import { OfficeRibbonService } from './office-ribbon.service';
import { effect, inject } from '@angular/core';
import { SolutionViewService } from '../../solution-view.service';

export class OfficeRibbonDesktopWebService extends OfficeRibbonService {
  private readonly solutionViewService = inject(SolutionViewService);

  constructor() {
    super();

    this.assignOfficeActions();
    this.initializeUpdateButtonsEffect();
  }

  private assignOfficeActions(): void {
    Office.actions.associate(
      'showSolution',
      (event: Office.AddinCommands.Event) => {
        this.solutionViewService.show();
        event.completed();
      },
    );
    Office.actions.associate(
      'hideSolution',
      (event: Office.AddinCommands.Event) => {
        this.solutionViewService.hide();
        event.completed();
      },
    );
  }

  private initializeUpdateButtonsEffect(): void {
    effect(() => {
      const showSolution = this.solutionViewService.showSolution();

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
