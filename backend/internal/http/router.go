package http

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Cassidym-Meredyth/while-true/backend/internal/auth"
	"github.com/Cassidym-Meredyth/while-true/backend/internal/http/handlers"
)

type Options struct {
	DB               *pgxpool.Pool
	KeycloakIssuer   string
	KeycloakAudience string
	PublicRoutes     bool // включить /pub для локальных тестов
}

func NewRouter(opt Options) *gin.Engine {
	r := gin.Default()
	_ = r.SetTrustedProxies(nil)

	// healthz
	r.GET("/healthz", func(c *gin.Context) { c.String(http.StatusOK, "ok") })
	r.GET("/db/healthz", func(c *gin.Context) {
		// берём контекст запроса и оборачиваем таймаутом
		ctx, cancel := context.WithTimeout(c.Request.Context(), time.Second)
		defer cancel()

		if err := opt.DB.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"ok": false, "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// handlers
	prj := &handlers.Projects{DB: opt.DB}
	usr := &handlers.Users{DB: opt.DB}

	// защищённые эндпоинты
	oidc := auth.NewOIDCMiddleware(opt.KeycloakIssuer, opt.KeycloakAudience, false)
	api := r.Group("/api", oidc)
	{
		api.GET("/projects", prj.List)
		api.POST("/projects", prj.Create)
		api.POST("/users", usr.Create)
		api.GET("/users", usr.List)
	}

	// публичные (удобно для локальных тестов, отключай в проде)
	if opt.PublicRoutes {
		pub := r.Group("/pub")
		{
			pub.GET("/projects", prj.List)
			pub.POST("/projects", prj.Create)
			pub.POST("/users", usr.Create)
			pub.GET("/users", usr.List)
		}
	}

	return r
}
