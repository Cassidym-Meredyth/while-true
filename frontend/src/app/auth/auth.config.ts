import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'http://localhost:8082/realms/icj',   // ← ВОТ ТУТ
  redirectUri: window.location.origin + '/',    // http://localhost:8085/
  clientId: 'icj-frontend',
  responseType: 'code',
  scope: 'openid profile email',
  showDebugInformation: true,
  useSilentRefresh: false,
  disablePKCE: false,               // PKCE=S256
  requireHttps: false,              // т.к. локально на http
  strictDiscoveryDocumentValidation: false
};
