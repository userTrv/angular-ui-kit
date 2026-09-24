import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: '@usertrv/ui · Angular UI kit on CDK',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'theming',
    title: 'Theming & tokens · @usertrv/ui',
    loadComponent: () => import('./pages/theming/theming-page').then((m) => m.ThemingPage),
  },
  {
    path: 'components/:slug',
    loadComponent: () => import('./pages/component/component-page').then((m) => m.ComponentPage),
  },
  { path: '**', redirectTo: '' },
];
