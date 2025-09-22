flowchart LR
  subgraph Users[Пользователи]
    F[Прораб\n(Foreman)]
    Q[Служба строит. контроля\n(QC)]
    I[Инспектор контрольного органа]
    A[Админ]
  end

  subgraph Frontend[Веб/моб. приложение (SPA, PWA)\nOffline cache + Sync]
    UI[UI/State\n(форма ТТН, график, карта)]
  end

  subgraph IAM[Keycloak (OIDC)]
    KC[(Realm icj\nRoles: foreman, qc, inspector, admin)]
  end

  subgraph API[Backend API (FastAPI/BFF)]
    BFF[Auth, RBAC, REST/GraphQL proxy,\nGeo-валидация, оркестрация]
  end

  subgraph Services[Сервисы]
    OCR[OCR-сервис\nOpenCV + Tesseract]
    S3[(S3/MinIO\nфото/документы)]
    PG[(PostgreSQL + PostGIS)]
    DS[(DataSpace CE, опционально:\nGraphQL CRUD по модели)]
  end

  subgraph Platform[Платформа/K8s/Ingress/CI-CD]
    MON[Логи/Мониторинг]
    TLS[TLS/Ingress]
  end

  F --> UI
  Q --> UI
  I --> UI
  A --> UI

  UI <-->|OIDC Code+PKCE| KC
  UI -->|HTTPS JSON| BFF
  BFF -->|JWT валидация (JWKS)| KC

  BFF -->|файлы| S3
  BFF -->|распознать ТТН| OCR
  BFF -->|CRUD/SQL| PG
  BFF -->|GraphQL (опц.)| DS

  BFF <-->|метрики| MON
  KC  <-->|метрики| MON
  Services <-->|мониторинг| MON

  UI -.offline queue/ retry.-> UI
  TLS --- UI
  TLS --- BFF
  TLS --- KC
