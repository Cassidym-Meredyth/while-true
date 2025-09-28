package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Users struct{ DB *pgxpool.Pool }

type UserDTO struct {
	ID       string   `json:"id"`
	Username string   `json:"username"`
	Email    string   `json:"email"`
	FullName string   `json:"full_name"`
	Active   bool     `json:"active"`
	Roles    []string `json:"roles"`
	KcSub    string   `json:"kc_sub,omitempty"`
}

// POST /users
func (h *Users) Create(c *gin.Context) {
	var in struct {
		Username string   `json:"username" binding:"required"`
		Email    string   `json:"email"`
		FullName string   `json:"full_name"`
		KcSub    string   `json:"kc_sub"` // можно не передавать
		Roles    []string `json:"roles"`  // например: ["qc","foreman"]
		Active   *bool    `json:"active"` // опционально
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(in.Roles) == 0 {
		in.Roles = []string{"qc"} // дефолт, при желании поменяй
	}

	tx, err := h.DB.Begin(c)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback(c)

	var id string
	var active bool
	qUser := `
		INSERT INTO app.user_account (username, email, full_name, kc_sub, active)
		VALUES ($1,$2,$3,NULLIF($4,''), COALESCE($5,true))
		RETURNING id::text, active`
	if err := tx.QueryRow(c, qUser,
		in.Username, in.Email, in.FullName, in.KcSub, in.Active).
		Scan(&id, &active); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// очистим и нормализуем роли
	roleSet := map[string]struct{}{}
	for _, r := range in.Roles {
		r = strings.ToLower(strings.TrimSpace(r))
		if r == "" {
			continue
		}
		roleSet[r] = struct{}{}
	}
	roles := make([]string, 0, len(roleSet))
	for r := range roleSet {
		roles = append(roles, r)
	}

	// присвоим роли; проверим, что такие роли есть в справочнике
	for _, rc := range roles {
		if _, err := tx.Exec(c,
			`INSERT INTO app.user_role(user_id, role_code)
			 SELECT $1, $2
			 WHERE EXISTS (SELECT 1 FROM app.role WHERE code=$2)`,
			id, rc); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
	}

	if err := tx.Commit(c); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	out := UserDTO{ID: id, Username: in.Username, Email: in.Email, FullName: in.FullName, Active: active, Roles: roles, KcSub: in.KcSub}
	c.JSON(http.StatusCreated, out)
}

// GET /users
func (h *Users) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT u.id::text,
				u.username,
				u.email,
				u.full_name,
				u.active,
				COALESCE(u.kc_sub, '') AS kc_sub,           -- ← чтобы не было NULL
				COALESCE(string_agg(ur.role_code, ',' ORDER BY ur.role_code), '') AS roles_csv
		FROM app.user_account u
		LEFT JOIN app.user_role ur ON ur.user_id = u.id
		GROUP BY u.id
		ORDER BY u.created_at DESC
		LIMIT 100`)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var list []UserDTO
	for rows.Next() {
		var u UserDTO
		var roles string
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.FullName, &u.Active, &u.KcSub, &roles); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		if roles == "" {
			u.Roles = []string{}
		} else {
			u.Roles = strings.Split(roles, ",")
		}
		list = append(list, u)
	}
	c.JSON(200, gin.H{"data": list})
}
