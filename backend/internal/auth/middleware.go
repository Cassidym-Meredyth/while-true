package auth

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
)

type ctxKey string

const (
	ClaimsKey ctxKey = "kcClaims"
	RolesKey  ctxKey = "kcRoles"
)

// Claims — то, что достаём из access_token.
type Claims struct {
	Subject       string `json:"sub"`
	PreferredName string `json:"preferred_username"`
	Email         string `json:"email"`
	// Realm roles
	RealmAccess struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
	// Client roles (если решишь их использовать)
	ResourceAccess map[string]struct {
		Roles []string `json:"roles"`
	} `json:"resource_access"`
}

type verifierHolder struct {
	once     sync.Once
	verifier *oidc.IDTokenVerifier
	err      error
}

// NewOIDCMiddleware возвращает gin-middleware, который:
// 1) достаёт Bearer-токен из заголовка,
// 2) валидирует подпись/срок через JWKS,
// 3) парсит claims и роли,
// 4) кладёт их в gin.Context.
func NewOIDCMiddleware(issuer, audience string, requireAudience bool) gin.HandlerFunc {
	if issuer == "" {
		issuer = os.Getenv("KEYCLOAK_ISSUER")
	}
	if audience == "" {
		audience = os.Getenv("KEYCLOAK_AUDIENCE") // обычно client_id фронта
	}

	var vh verifierHolder

	// лениво инициализируем провайдера/verifier (потокобезопасно)
	initVerifier := func(ctx context.Context) (*oidc.IDTokenVerifier, error) {
		vh.once.Do(func() {
			provider, err := oidc.NewProvider(ctx, issuer)
			if err != nil { /* ... */
			}

			cfg := &oidc.Config{
				SkipClientIDCheck: true, // <— главное
			}
			vh.verifier = provider.Verifier(cfg)
		})
		return vh.verifier, vh.err
	}

	return func(c *gin.Context) {
		authz := c.GetHeader("Authorization")
		if !strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		raw := strings.TrimSpace(authz[len("Bearer "):])

		verifier, err := initVerifier(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "oidc init failed", "detail": err.Error()})
			return
		}

		idToken, err := verifier.Verify(c, raw)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token verify failed", "detail": err.Error()})
			return
		}

		// если не включили строгую проверку audience в verifier’e — проверим сами (опционально)
		if !requireAudience && audience != "" {
			// токены Keycloak могут иметь aud как строку или массив строк
			var audAny any
			if err := idToken.Claims(&struct {
				Aud any `json:"aud"`
			}{&audAny}); err == nil && !audContains(audAny, audience) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid audience"})
				return
			}
		}

		var cl Claims
		if err := idToken.Claims(&cl); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "claims parse failed"})
			return
		}

		c.Set(string(ClaimsKey), cl)
		c.Set(string(RolesKey), mergeRoles(cl))
		c.Next()
	}
}

func audContains(aud any, want string) bool {
	switch v := aud.(type) {
	case string:
		return v == want
	case []any:
		for _, x := range v {
			if s, ok := x.(string); ok && s == want {
				return true
			}
		}
	}
	return false
}

func mergeRoles(c Claims) []string {
	set := map[string]struct{}{}
	for _, r := range c.RealmAccess.Roles {
		set[r] = struct{}{}
	}
	for _, v := range c.ResourceAccess {
		for _, r := range v.Roles {
			set[r] = struct{}{}
		}
	}
	out := make([]string, 0, len(set))
	for r := range set {
		out = append(out, r)
	}
	return out
}

// Helpers

// FromContext возвращает Claims и роли.
func FromContext(c *gin.Context) (Claims, []string, error) {
	v, ok := c.Get(string(ClaimsKey))
	if !ok {
		return Claims{}, nil, errors.New("no claims in context")
	}
	claims := v.(Claims)

	vr, ok := c.Get(string(RolesKey))
	if !ok {
		return claims, nil, errors.New("no roles in context")
	}
	roles := vr.([]string)
	return claims, roles, nil
}

// RequireRoles — дополнительный RBAC-мидлвар (используй после OIDC-мидлвара).
func RequireRoles(needAnyOf ...string) gin.HandlerFunc {
	want := map[string]struct{}{}
	for _, r := range needAnyOf {
		want[r] = struct{}{}
	}
	return func(c *gin.Context) {
		_, roles, err := FromContext(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no auth context"})
			return
		}
		for _, have := range roles {
			if _, ok := want[have]; ok {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	}
}
