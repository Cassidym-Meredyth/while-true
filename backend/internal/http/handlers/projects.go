package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Projects struct{ DB *pgxpool.Pool }

type Project struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

func (h *Projects) Create(c *gin.Context) {
	var in struct {
		Name   string `json:"name" binding:"required"`
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if in.Status == "" {
		in.Status = "planned"
	}

	var p Project
	q := `INSERT INTO app.project (name, status)
	      VALUES ($1,$2)
	      RETURNING id::text, name, status, created_at`
	if err := h.DB.QueryRow(c, q, in.Name, in.Status).
		Scan(&p.ID, &p.Name, &p.Status, &p.CreatedAt); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, p)
}

func (h *Projects) List(c *gin.Context) {
	rows, err := h.DB.Query(c, `
		SELECT id::text, name, status, created_at
		FROM app.project
		ORDER BY created_at DESC
		LIMIT 50`)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var out []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Status, &p.CreatedAt); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		out = append(out, p)
	}
	c.JSON(200, gin.H{"data": out})
}
