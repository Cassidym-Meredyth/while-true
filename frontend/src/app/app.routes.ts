import { Routes } from '@angular/router';

export const routes: Routes = [
  // старт с авторизации
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // AUTH
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./auth/register.page').then((m) => m.RegisterPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },

  // ADMIN (без изменений)
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

  // CUSTOMER 
  {
    path: 'customer',
    loadComponent: () =>
      import('./pages/customer/customer.page').then((m) => m.CustomerPage),
  },
  // foreman 
  {
    path: 'foreman',
    loadComponent: () =>
      import('./pages/foreman/foreman.page').then((m) => m.ForemanPage),
  },
    // inspector 
  {
    path: 'inspector',
    loadComponent: () =>
      import('./pages/inspector/inspector.page').then((m) => m.InspectorPage),
  },

  { path: '**', redirectTo: 'auth/login' },
];
