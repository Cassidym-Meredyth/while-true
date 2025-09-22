# Развертывание в закрытом контуре

## 1. Требования
- Docker/Compose или Kubernetes (k3s/microk8s)
- Postgres 15 + PostGIS
- MinIO (S3) для файлов
- Keycloak 24+ (Realm `icj`)

## 2. Переменные окружения
- BACKEND: `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `KEYCLOAK_ISSUER`, `KEYCLOAK_AUDIENCE`
- KEYCLOAK: admin user/pass
- MINIO: root user/pass

## 3. Запуск (docker-compose)
```bash
cp backend/.env.example backend/.env
docker compose up --build
