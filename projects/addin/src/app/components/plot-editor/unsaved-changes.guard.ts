import { CanDeactivateFn } from '@angular/router';
import { PlotEditor } from './plot-editor';

export const unsavedChangesGuard: CanDeactivateFn<PlotEditor> = component =>
  component.canDeactivate();
