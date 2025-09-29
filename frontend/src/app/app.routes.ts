import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin/users' },

  {
    path: 'admin',
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.page').then(
            (m: any) => m.AdminUsersPageComponent ?? m.default
          ),
      },
      {
        path: 'dicts',
        loadComponent: () =>
          import('./pages/dicts/dicts.page').then(
            (m: any) => m.DictsPageComponent ?? m.default
          ),
      },
    ],
  },

  { path: '**', redirectTo: 'admin/users' },
];
