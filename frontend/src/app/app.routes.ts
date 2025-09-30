import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },

  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-users/admin-shell.component').then(
        (m) => m.AdminShellComponent
      ),
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.page').then(
            (m) => m.AdminUsersPage
          ),
      },
      {
        path: 'dicts',
        loadComponent: () =>
          import('./pages/dicts/dicts.page').then((m) => m.DictsPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'users' },
    ],
  },

  { path: '**', redirectTo: 'admin' },
];
