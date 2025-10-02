# Развертывание в закрытом контуре

## 1. Требования
- Docker/Compose или Kubernetes (k3s/microk8s)
- Postgres 15 + PostGIS
- Keycloak 24+ (Realm `icj`)

## 2. Переменные окружения
- BACKEND: `DATABASE_URL`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE`
- KEYCLOAK: admin user/pass

## 3. Запуск (docker-compose)
```bash
docker compose up -d --build
```