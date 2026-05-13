import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SolutionViewService {
  readonly showSolution = signal(false);

  // eslint-disable-next-line @typescript-eslint/require-await -- awaited regenerate logic is added in a follow-up task
  async toggle(): Promise<void> {
    this.showSolution.update(v => !v);
  }
}
