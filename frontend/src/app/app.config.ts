import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptors,
  withJsonpSupport,
} from '@angular/common/http';
import { API_BASE_URL } from './core/api.tokens';
import { authInterceptor } from './core/auth.interceptor';

const API_URL = 'http://localhost:8081';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]), withJsonpSupport()),
    { provide: API_BASE_URL, useValue: API_URL },
  ],
};
