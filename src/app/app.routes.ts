import { Routes } from '@angular/router';
import { PlotList } from './components/plot-list/plot-list';
import { PlotEditor } from './components/plot-editor/plot-editor';
import { Info } from './components/info/info';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/plot',
  },
  {
    path: 'plot',
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
];
