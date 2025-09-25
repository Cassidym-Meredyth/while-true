package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Cassidym-Meredyth/while-true/backend/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func init() { _ = godotenv.Load(".env") }

func main() {
	issuer := os.Getenv("KEYCLOAK_ISSUER")
	aud := os.Getenv("KEYCLOAK_AUDIENCE")

	fmt.Println("ISSUER:", issuer)
	fmt.Println("AUDIENCE:", aud)
	if issuer == "" {
		panic("KEYCLOAK_ISSUER is empty — проверь .env или окружение")
	}

	r := gin.Default()
	_ = r.SetTrustedProxies(nil)
	r.GET("/healthz", func(c *gin.Context) { c.String(200, "ok") })

	oidc := auth.NewOIDCMiddleware(issuer, aud, false)
	api := r.Group("/api", oidc)

	api.GET("/ping", func(c *gin.Context) {
		claims, roles, _ := auth.FromContext(c)
		c.JSON(http.StatusOK, gin.H{
			"ok":    true,
			"user":  claims.PreferredName,
			"roles": roles,
			"sub":   claims.Subject,
			"email": claims.Email,
		})
	})

	api.GET("/qc/objects", auth.RequireRoles("qc", "admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"data": "only for qc/admin"})
	})

	_ = r.Run(":8081")
}
