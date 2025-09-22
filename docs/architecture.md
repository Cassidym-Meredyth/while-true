# Архитектура (MVP)

## Обзор
Кратко: SPA/PWA → FastAPI → PostgreSQL+PostGIS/S3/Keycloak + OCR.

## Диаграмма (mermaid)
```mermaid
flowchart LR
  subgraph Users["Пользователи"]
    F["Прораб"]
    Q["Служба строит. контроля (QC)"]
    I["Инспектор контроля"]
    A["Админ"]
  end

  subgraph Frontend["Веб/моб. приложение (SPA/PWA)"]
    UI["UI/State (карточки, график, карта, ТТН)"]
    OFF["Offline cache + Sync (очередь, retry)"]
  end

  subgraph IAM["Keycloak (OIDC)"]
    KC[/"Realm icj\nRoles: foreman, qc, inspector, admin"/]
  end

  subgraph API["Backend API (FastAPI, REST)"]
    BFF["Auth/RBAC, доменная логика,\nгео-валидация, файлы, OCR-оркестрация"]
  end

  subgraph Data["Хранилища/сервисы"]
    PG[("PostgreSQL + PostGIS")]
    S3[("S3/MinIO — фото/документы")]
    OCR["OCR-сервис (OpenCV + Tesseract)"]
    MON["Мониторинг/Логи"]
  end

  F --> UI
  Q --> UI
  I --> UI
  A --> UI

  UI --> OFF
  UI <-->|"OIDC Code + PKCE"| KC
  UI -->|"HTTPS/JSON"| BFF
  BFF -->|"JWKS валидация JWT"| KC

  BFF -->|"CRUD/SQL"| PG
  BFF -->|"presigned URLs"| S3
  BFF -->|"распознать ТТН"| OCR

  BFF <-->|"метрики/логи"| MON
  KC  <-->|"метрики/логи"| MON


