import { Routes } from '@angular/router';
import { PlotList } from './components/plot-list/plot-list';
import { PlotEditor } from './components/plot-editor/plot-editor';
import { Info } from './components/info/info';
import { FirstRunExperience } from './components/first-run-experience/first-run-experience';
import { redirectToFirstRunExperience } from './components/first-run-experience/redirect-to-first-run-experience';
import { wordForWebNoticeGuard } from './components/word-for-web-notice/word-for-web-notice.guard';
import { WordForWebNotice } from './components/word-for-web-notice/word-for-web-notice.component';
import { DebugInfo } from './components/debug-info/debug-info';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: redirectToFirstRunExperience,
  },
  {
    path: 'plot',
    canActivate: [wordForWebNoticeGuard],
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
        path: 'editor/:id',
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
      {
        path: 'debug',
        component: DebugInfo,
      },
    ],
  },
  {
    path: 'first-run-experience',
    component: FirstRunExperience,
    canActivate: [wordForWebNoticeGuard],
  },
  {
    path: 'word-for-web-notice',
    component: WordForWebNotice,
  },
];
