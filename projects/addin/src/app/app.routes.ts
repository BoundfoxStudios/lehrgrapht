import { Routes } from '@angular/router';
import { PlotList } from './components/plot-list/plot-list';
import { PlotEditor } from './components/plot-editor/plot-editor';
import { Info } from './components/info/info';
import { FirstRunExperience } from './components/first-run-experience/first-run-experience';
import { redirectToFirstRunExperience } from './components/first-run-experience/redirect-to-first-run-experience';
import { cannotRunOnlineGuard } from './components/cannot-run-online/cannot-run-online.guard';
import { CannotRunOnline } from './components/cannot-run-online/cannot-run-online';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: redirectToFirstRunExperience,
  },
  {
    path: 'plot',
    canActivate: [cannotRunOnlineGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'list',
        component: PlotList,
      },
      {
        path: 'editor/:officeId',
        component: PlotEditor,
      },
      {
        path: 'editor',
        component: PlotEditor,
      },
      {
        path: 'info',
        component: Info,
      },
    ],
  },
  {
    path: 'first-run-experience',
    component: FirstRunExperience,
    canActivate: [cannotRunOnlineGuard],
  },
  {
    path: 'cannot-run-online',
    component: CannotRunOnline,
  },
];
