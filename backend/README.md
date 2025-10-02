# Backend-часть проекта "Интерактивный электронный журнал общего строительного контроля"

## Структура бека (ранняя сборка)
```
backend
├───cmd
│   └───api
│       └───main.go
│
├───KeyCloak
│   └───icj.json
│
└───internal
    ├───auth
    │   └───middleware.go
    │
    ├───db
    │   └───pool.go
    │
    └───http
        ├───router.go
        │
        └───handlers
            ├───auth.go
            ├───projects.go
            └───users.go

```