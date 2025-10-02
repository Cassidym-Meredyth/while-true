package auth

import (
	"context"
	"errors"
	"net/http"
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

type Claims struct {
	Subject       string `json:"sub"`
	PreferredName string `json:"preferred_username"`
	Email         string `json:"email"`
	RealmAccess   struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
	ResourceAccess map[string]struct {
		Roles []string `json:"roles"`
	} `json:"resource_access"`
}

type verifierHolder struct {
	once     sync.Once
	verifier *oidc.IDTokenVerifier
	err      error
}

func NewOIDCMiddleware(issuer, audience string, _ bool) gin.HandlerFunc {
	var vh verifierHolder

	initVerifier := func(ctx context.Context) (*oidc.IDTokenVerifier, error) {
		vh.once.Do(func() {
			provider, err := oidc.NewProvider(ctx, issuer)
			if err != nil {
				vh.err = err
				return
			}
			// Проверяем подпись и iss. client_id проверять не будем (токен – access)
			cfg := &oidc.Config{
				SkipClientIDCheck: true,
			}
			vh.verifier = provider.Verifier(cfg)
		})
		return vh.verifier, vh.err
	}

	return func(c *gin.Context) {
		parts := strings.SplitN(c.GetHeader("Authorization"), " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.Header("WWW-Authenticate", `Bearer realm="icj"`)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		raw := strings.TrimSpace(parts[1])

		verifier, err := initVerifier(c)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "oidc init failed", "detail": err.Error()})
			return
		}

		idToken, err := verifier.Verify(c, raw)
		if err != nil {
			c.Header("WWW-Authenticate", `Bearer error="invalid_token"`)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token verify failed", "detail": err.Error()})
			return
		}

		var cl Claims
		if err := idToken.Claims(&cl); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "claims parse failed"})
			return
		}

		// ==== ЖЁСТКАЯ ПРОВЕРКА AUDIENCE ====
		// В Keycloak aud может быть строкой или массивом. go-oidc не разворачивает его в структуру,
		// поэтому читаем «сырые» claims:
		var rawMap map[string]any
		if err := idToken.Claims(&rawMap); err == nil {
			okAud := false
			switch v := rawMap["aud"].(type) {
			case string:
				okAud = (v == audience)
			case []any:
				for _, it := range v {
					if s, _ := it.(string); s == audience {
						okAud = true
						break
					}
				}
			}
			if audience != "" && !okAud {
				c.Header("WWW-Authenticate", `Bearer error="invalid_token", error_description="aud mismatch"`)
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "audience mismatch"})
				return
			}
		}

		// Собираем роли
		roleSet := map[string]struct{}{}
		for _, r := range cl.RealmAccess.Roles {
			roleSet[r] = struct{}{}
		}
		for _, ra := range cl.ResourceAccess {
			for _, r := range ra.Roles {
				roleSet[r] = struct{}{}
			}
		}
		roles := make([]string, 0, len(roleSet))
		for r := range roleSet {
			roles = append(roles, r)
		}

		c.Set(string(ClaimsKey), cl)
		c.Set(string(RolesKey), roles)
		c.Next()
	}
}

func FromContext(c *gin.Context) (Claims, []string, error) {
	v, ok := c.Get(string(ClaimsKey))
	if !ok {
		return Claims{}, nil, errors.New("no claims")
	}
	claims := v.(Claims)
	vr, ok := c.Get(string(RolesKey))
	if !ok {
		return claims, nil, errors.New("no roles")
	}
	return claims, vr.([]string), nil
}

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
