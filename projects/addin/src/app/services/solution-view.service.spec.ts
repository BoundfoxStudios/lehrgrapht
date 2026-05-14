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

  it('sets showSolution to true on show()', () => {
    service.show();
    expect(service.showSolution()).toBe(true);
  });

  it('sets showSolution to false on hide()', () => {
    service.show();
    service.hide();
    expect(service.showSolution()).toBe(false);
  });

  it('is idempotent — calling show() twice keeps showSolution true', () => {
    service.show();
    service.show();
    expect(service.showSolution()).toBe(true);
  });

  it('is idempotent — calling hide() when already false keeps showSolution false', () => {
    service.hide();
    expect(service.showSolution()).toBe(false);
  });
});
