// src/app/auth/keycloak-init.ts
import Keycloak from 'keycloak-js';

export const keycloak = new (Keycloak as any)({
  url: 'http://host.docker.internal:8082', // ← БАЗОВЫЙ URL KC
  realm: 'icj',
  clientId: 'icj-frontend',
});

export async function initKeycloak(): Promise<void> {
  const authenticated = await keycloak.init({
    onLoad: 'login-required',  // отправит на логин и вернёт назад
    pkceMethod: 'S256',
    checkLoginIframe: false,
  });

  if (!authenticated) {
    await keycloak.login();
    return;
  }

  // кладём туда, откуда читает твой интерцептор
  localStorage.setItem('access_token', keycloak.token!);

  // автообновление токена
  setInterval(async () => {
    try {
      const refreshed = await keycloak.updateToken(30);
      if (refreshed) {
        localStorage.setItem('access_token', keycloak.token!);
      }
    } catch (e) {
      console.error('Token refresh failed', e);
    }
  }, 20000);
}
