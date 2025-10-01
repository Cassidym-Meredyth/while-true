// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  // стартуем с авторизации
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  // AUTH: логин и регистрация
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

  // ADMIN: оставляем как было (оболочка + дочерние экраны)
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

  // позже сюда спокойно добавим foreman / inspector / customer
  { path: '**', redirectTo: 'auth/login' },
];
