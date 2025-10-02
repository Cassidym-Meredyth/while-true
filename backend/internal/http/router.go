package http

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Cassidym-Meredyth/while-true/backend/internal/auth"
	"github.com/Cassidym-Meredyth/while-true/backend/internal/http/handlers"

	"github.com/gin-contrib/cors"
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

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8085"}, // адрес фронта
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "Accept", "Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// healthz
	r.GET("/healthz", func(c *gin.Context) { c.String(http.StatusOK, "ok") })
	r.GET("/db/healthz", func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), time.Second)
		defer cancel()
		if err := opt.DB.Ping(ctx); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"ok": false, "error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// ===== handlers =====
	prj := &handlers.Projects{DB: opt.DB}
	usr := &handlers.Users{DB: opt.DB}
	authH := &handlers.Auth{DB: opt.DB} // ← ДОБАВИЛИ: хэндлер авторизации

	// ----- ПУБЛИЧНЫЕ РОУТЫ -----
	// фронт шлёт POST /auth/login с {login,password}
	r.POST("/auth/login", authH.Login) // ← ДОБАВИЛИ

	// (если понадобится регистрация через бэк, тут же можно добавить:)
	// r.POST("/auth/register", authH.Register)

	// ----- ЗАЩИЩЁННЫЕ РОУТЫ (OIDC) -----
	oidc := auth.NewOIDCMiddleware(opt.KeycloakIssuer, opt.KeycloakAudience, false)

	api := r.Group("/api", oidc)
	{
		api.GET("/projects", prj.List)
		api.POST("/projects", prj.Create)
		api.POST("/users", usr.Create)
		api.GET("/users", usr.List)
	}

	admin := r.Group("/admin", oidc)
	{
		// admin.Use(auth.RequireRoles("admin")) // при необходимости
		admin.GET("/users", usr.List)
		admin.POST("/users", usr.Create)
	}

	// ----- ПУБЛИЧНЫЕ ДЛЯ ЛОКАЛКИ (по флагу) -----
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
