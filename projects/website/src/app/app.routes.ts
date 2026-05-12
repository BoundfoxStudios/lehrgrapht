import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { PrivacyPolicyPage } from './pages/privacy-policy-page/privacy-policy-page';
import { ChangelogPage } from './pages/changelog-page/changelog-page';
import { ImprintPage } from './pages/imprint-page/imprint-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomePage,
  },
  {
    path: 'changelog',
    component: ChangelogPage,
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyPage,
  },
  {
    path: 'imprint',
    component: ImprintPage,
  },
];
