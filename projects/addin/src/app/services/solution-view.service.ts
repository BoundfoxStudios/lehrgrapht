import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SolutionViewService {
  readonly showSolution = signal(false);

  show(): void {
    this.showSolution.set(true);
  }

  hide(): void {
    this.showSolution.set(false);
  }
}
