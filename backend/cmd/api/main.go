package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Cassidym-Meredyth/while-true/backend/internal/db"
	httpx "github.com/Cassidym-Meredyth/while-true/backend/internal/http"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env")

	issuer := os.Getenv("KEYCLOAK_ISSUER")
	aud := os.Getenv("KEYCLOAK_AUDIENCE")
	dsn := os.Getenv("DATABASE_URL")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	if issuer == "" {
		log.Fatal("KEYCLOAK_ISSUER is empty")
	}
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty")
	}

	pool, err := db.NewPool(dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	// быстрый ping
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("db ping failed: %v", err)
	}

	r := httpx.NewRouter(httpx.Options{
		DB:               pool,
		KeycloakIssuer:   issuer,
		KeycloakAudience: aud,
		PublicRoutes:     true, // ← на время локальных тестов
	})

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("HTTP server started on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	// graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down...")
	ctxSh, cancelSh := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelSh()
	_ = srv.Shutdown(ctxSh)
	log.Println("bye")
	fmt.Print("") // no-op
}
