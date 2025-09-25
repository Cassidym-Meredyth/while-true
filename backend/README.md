# Backend-часть проекта "Интерактивный электронный журнал общего строительного контроля"

## Структура бека (ранняя сборка)
```
backend
├───cmd
│   └───api
│       └───main.go
└───internal
    └───auth
        └───middleware.go
```

## Что вообще происходит в этом бекэнде???

1. Пользователь получает JWT в Keycloak.
2. Фронт кладет его в заголовок Authorization: Bearer <token>.
3. Запрос прилетает в Gin на `/api/*`
4. Наш OIDC-middleware:
    - достает токен из заголовка,
    - проверяет подпись/срок действия по ключам Keycloak,
    - вытаскивает claims и roles из Keycloak,
    - кладет их в gin.Context.
5. Хендлер видит в контексте пользователя и роли и решает, что отдать.
6. Доп. миддлварка RequireRoles может заблокировать доступ, если роли не подходят.

## Файл middleware.go - по строкам
### Импорты и базовые типы

```go
type ctxKey string
const (
  ClaimsKey ctxKey = "kcClaims"
  RolesKey  ctxKey = "kcRoles"
)
```

- Длеает "уникальные" ключи для контекста (тип-обертка `ctxKey` спасает от коллизий имен).

```go
type Claims struct {
  Subject string `json:"sub"`
  PreferredName string `json:"preferred_username"`
  Email string `json:"email"`
  RealmAccess struct{ Roles []string `json:"roles"` } `json:"realm_access"`
  ResourceAccess map[string]struct{ Roles []string `json:"roles"` } `json:"resource_access"`
}
```

- Структура, в которую мы декодируем клеймы JWT.
- `realm_access.roles` — realm-роли (общие для всего realm).
- `resource_access.<client>.roles` — client-роли (привязаны к клиенту).

### Создание верификатора (JWKS)
```go
type verifierHolder struct{ 
            once sync.Once; 
            verifier *oidc.IDTokenVerifier; 
            err error 
}
```
- Хотим создать `verifier` один раз на весь процесс (он внутри подтянет OpenID-конфигурацию и публичные ключи JWKS).
- `sync.Once` гарантирует, что даже при одновременных запросах инициализация произойдёт ровно один раз.

### Конструктор мидлвары
```go
func NewOIDCMiddleware(issuer, _ string, _ bool) gin.HandlerFunc {
  // ...
  provider, err := oidc.NewProvider(ctx, issuer)
  cfg := &oidc.Config{ SkipClientIDCheck: true }
  vh.verifier = provider.Verifier(cfg)
}
```

- `issuer` — адрес твоего realm (`http://localhost:8080/realms/icj`).
- `oidc.NewProvider` по `issuer/.well-known/openid-configuration` находит все нужные URL и ключи.
- `SkipClientIDCheck: true` — мы отключили проверку `aud` (удобно на деве, когда `aud` в токене = `"account"`).

### Обработка запроса
```go
parts := strings.SplitN(c.GetHeader("Authorization"), " ", 2)
if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") { 401 }
raw := strings.TrimSpace(parts[1])
```

- Аккуратно достаём токен из заголовка. `EqualFold` — без чувствительности к регистру (`Bearer`/`bearer`).

```go
idToken, err := verifier.Verify(c, raw)
```

- Проверка подписи токена, времени жизни и пр. по ключам Keycloak (JWKS).
- Если истёк/подделан — будет ошибка.

```go
var cl Claims
if err := idToken.Claims(&cl); err != nil { 401 }
```

- Декодируем JSON-клеймы токена в нашу структуру.

```go
roleSet := map[string]struct{}{}
for _, r := range cl.RealmAccess.Roles { roleSet[r] = struct{}{} }
for _, ra := range cl.ResourceAccess { for _, r := range ra.Roles { roleSet[r] = struct{}{} } }
```

- Собираем все роли в сет, чтобы не было дублей.

```go
c.Set(string(ClaimsKey), cl)
c.Set(string(RolesKey), roles)
c.Next()
```

- Кладем клеймы и роли в контекст запроса, дальше их смогут прочитать хендлеры.

### Утилиты
```go
func FromContext(c *gin.Context) (Claims, []string, error)
```
- Достаёт клеймы и роли из контекста.

```go
func RequireRoles(needAnyOf ...string) gin.HandlerFunc
```
- RBAC-мидлварка: пропустит, если у юзера есть хоть одна из перечисленных ролей.

- Если нет — вернёт `403 forbidden`.

## Файл main.go - по строкам
```go
func init() { _ = godotenv.Load(".env") }
```
- Для дев-окружения читаем `.env` (в проде — переменные окружения/секреты).

```go
issuer := os.Getenv("KEYCLOAK_ISSUER")
aud    := os.Getenv("KEYCLOAK_AUDIENCE")
fmt.Println("ISSUER:", issuer)
fmt.Println("AUDIENCE:", aud)
```
- Берём настройки Keycloak из окружения. Печать — просто контроль, что всё подхватилось.

```go
r := gin.Default()
_ = r.SetTrustedProxies(nil)
r.GET("/healthz", func(c *gin.Context) { c.String(200, "ok") })
```
- Базовый Gin + публичный healthcheck (без авторизации).

```go
oidc := auth.NewOIDCMiddleware(issuer, aud, false)
api  := r.Group("/api", oidc)
```
- Все пути внутри `/api` защищены нашей OIDC-мидлварой.

```go
api.GET("/ping", func(c *gin.Context) {
  claims, roles, _ := auth.FromContext(c)
  c.JSON(200, gin.H{"ok": true, "user": claims.PreferredName, "roles": roles, ...})
})
```
- Пример защищённого эндпоинта: показывает, что мы реально извлекли пользователя и роли из токена.

```go
api.GET("/qc/objects", auth.RequireRoles("qc","admin"), handler)
```
- Пример ролевой защиты: пускаем только `qc` или `admin`.

---
По итогу получается готовый каркас безопасности: любой запрос к API требует валидного токена, а права легко описываются ролями.
Фронт авторизуется в Keycloak, берет токен и ходит к `/api/*`

---

## Тестирование
Получить токен: запускаем PowerShell от имени администратора и пишем в терминале

```
$resp  = curl.exe -s -X POST "http://localhost:8080/realms/icj/protocol/openid-connect/token" -H "Content-Type: application/x-www-form-urlencoded" -d "client_id=icj-frontend" -d "grant_type=password" -d "username=customer" -d "password=123" # или admin, inspector, foreman (у всех один и тот же пароль)

$token = ((ConvertFrom-Json $resp).access_token).Trim()

Invoke-RestMethod -Uri "http://localhost:8081/api/ping" -Headers @{ Authorization = ("Bearer " + $token) }
```
