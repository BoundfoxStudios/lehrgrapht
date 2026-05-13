import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SolutionViewService {
  readonly showSolution = signal(false);

  toggle(): void {
    this.showSolution.update(v => !v);
  }
}
