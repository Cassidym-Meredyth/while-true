import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { initKeycloak } from './app/auth/keycloak-init';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));

(async () => {
  await initKeycloak();                         // ← ждём логин и токен
  await bootstrapApplication(AppComponent, appConfig);
})();