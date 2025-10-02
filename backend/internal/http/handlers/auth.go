package handlers

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Auth struct{ DB *pgxpool.Pool }

// POST /auth/login
func (h *Auth) Login(c *gin.Context) {
	var in struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad input"})
		return
	}

	form := url.Values{
		"grant_type":    {"password"},
		"client_id":     {"icj-cli"},
		"client_secret": {os.Getenv("KC_CLIENT_SECRET")},
		"username":      {in.Login},
		"password":      {in.Password},
	}
	resp, err := http.PostForm(os.Getenv("KC_TOKEN_URL"), form)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "kc unreachable"})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		b, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "kc auth failed", "detail": string(b)})
		return
	}
	var tok struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tok); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "decode token"})
		return
	}

	// извлечём sub/username/email из payload
	parts := strings.Split(tok.AccessToken, ".")
	payload, _ := base64.RawURLEncoding.DecodeString(parts[1])
	var claims struct {
		Sub   string `json:"sub"`
		Pref  string `json:"preferred_username"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}
	_ = json.Unmarshal(payload, &claims)

	// upsert пользователя и вернуть роль
	var out struct {
		ID, Login, Role, Name string
	}
	err = h.DB.QueryRow(c, `
		INSERT INTO app.user_account (kc_sub, username, email, full_name, active)
		VALUES ($1,$2,$3,COALESCE(NULLIF($4,''),$2), true)
		ON CONFLICT (kc_sub) DO UPDATE SET username=EXCLUDED.username
		RETURNING id::text,
		          username,
		          COALESCE((
		              SELECT ur.code FROM app.user_role ur
		              WHERE ur.user_id = app.user_account.id
		              ORDER BY ur.code LIMIT 1
		          ), 'admin') AS role,
		          full_name
	`, claims.Sub, claims.Pref, claims.Email, claims.Name).
		Scan(&out.ID, &out.Login, &out.Role, &out.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accessToken": tok.AccessToken,
		"user": gin.H{
			"id":    out.ID,
			"login": out.Login,
			"role":  out.Role,
			"name":  out.Name,
		},
	})
}
