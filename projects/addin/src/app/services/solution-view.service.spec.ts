import { TestBed } from '@angular/core/testing';
import { SolutionViewService } from './solution-view.service';

describe('SolutionViewService', () => {
  let service: SolutionViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolutionViewService);
  });

  it('defaults showSolution to false', () => {
    expect(service.showSolution()).toBe(false);
  });

  it('flips showSolution on toggle', async () => {
    await service.toggle();
    expect(service.showSolution()).toBe(true);
    await service.toggle();
    expect(service.showSolution()).toBe(false);
  });
});
