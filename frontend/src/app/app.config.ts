import { ApplicationConfig } from '@angular/core';
import {
  provideRouter,
  withHashLocation,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withHashLocation(), // ⇒ URL вида /#/admin/...
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
  ],
};
