## Системный контекст

```mermaid
flowchart LR
  subgraph Users["Пользователи"]
    F["Прораб"]
    Q["Служба строительного контроля (QC)"]
    I["Инспектор контрольного органа"]
    A["Админ"]
  end

  subgraph Frontend["Веб/моб. приложение (SPA/PWA)"]
    UI["UI/State (форма ТТН, график, карта)"]
    OFF["Offline cache + Sync"]
  end

  subgraph IAM["Keycloak (OIDC)"]
    KC[/"Realm icj\nRoles: foreman, qc, inspector, admin"/]
  end

  subgraph API["Backend API (FastAPI/BFF)"]
    BFF["Auth, RBAC, REST/GraphQL proxy,\nGeo-валидация, оркестрация"]
  end

  subgraph Services["Сервисы"]
    OCR["OCR-сервис (OpenCV + Tesseract)"]
    S3[("S3/MinIO (фото/документы)")]
    PG[("PostgreSQL + PostGIS")]
    DS[("DataSpace CE (опц.)\nGraphQL CRUD по модели")]
  end

  subgraph Platform["Платформа (K8s/Ingress/CI-CD)"]
    MON["Логи/Мониторинг"]
    TLS["TLS/Ingress"]
  end

  F --> UI
  Q --> UI
  I --> UI
  A --> UI

  UI --> OFF
  UI <-->|"OIDC Code + PKCE"| KC
  UI -->|"HTTPS JSON"| BFF
  BFF -->|"JWT валидация (JWKS)"| KC

  BFF -->|"файлы"| S3
  BFF -->|"распознать ТТН"| OCR
  BFF -->|"CRUD/SQL"| PG
  BFF -->|"GraphQL (опц.)"| DS

  BFF <-->|"метрики"| MON
  KC  <-->|"метрики"| MON

  UI -. "offline queue / retry" .-> UI
