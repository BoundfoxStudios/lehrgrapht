import { Routes } from '@angular/router';
import { PlotList } from './components/plot-list/plot-list';
import { PlotEditor } from './components/plot-editor/plot-editor';
import { PlotEditorHub } from './components/plot-editor-hub/plot-editor-hub';
import { SectionFnx } from './components/plot-editor/sections/section-fnx/section-fnx';
import { SectionMarkers } from './components/plot-editor/sections/section-markers/section-markers';
import { SectionPolygons } from './components/plot-editor/sections/section-polygons/section-polygons';
import { SectionDisplay } from './components/plot-editor/sections/section-display/section-display';
import { SectionReflection } from './components/plot-editor/sections/section-reflection/section-reflection';
import { unsavedChangesGuard } from './components/plot-editor/unsaved-changes.guard';
import { Info } from './components/info/info';
import { FirstRunExperience } from './components/first-run-experience/first-run-experience';
import { redirectToFirstRunExperience } from './components/first-run-experience/redirect-to-first-run-experience';
import { wordForWebNoticeGuard } from './components/word-for-web-notice/word-for-web-notice.guard';
import { WordForWebNotice } from './components/word-for-web-notice/word-for-web-notice.component';
import { DebugInfo } from './components/debug-info/debug-info';
import { Changelog } from './components/changelog/changelog';
import { changelogGuard } from './components/changelog/changelog.guard';
import { Settings } from './components/settings/settings';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: redirectToFirstRunExperience,
  },
  {
    path: 'plot',
    canActivate: [wordForWebNoticeGuard, changelogGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'list',
      },
      {
        path: 'settings',
        component: Settings,
      },
      {
        path: 'list',
        component: PlotList,
      },
      {
        path: 'editor',
        pathMatch: 'full',
        redirectTo: 'editor/new',
      },
      {
        path: 'editor/:id',
        component: PlotEditor,
        canDeactivate: [unsavedChangesGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: PlotEditorHub,
          },
          {
            path: 'display',
            component: SectionDisplay,
          },
          {
            path: 'fnx',
            component: SectionFnx,
          },
          {
            path: 'markers',
            component: SectionMarkers,
          },
          {
            path: 'polygons',
            component: SectionPolygons,
          },
          {
            path: 'reflection',
            component: SectionReflection,
          },
        ],
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
    path: 'changelog',
    component: Changelog,
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
