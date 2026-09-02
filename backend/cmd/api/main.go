package main

import (
	"log"
	"os"

	"kasku-backend/internal/auth"
	"kasku-backend/internal/categories"
	"kasku-backend/internal/portfolios"
	"kasku-backend/internal/transactions"
	"kasku-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Connect to database
	database.Connect()
	database.Migrate()

	// Setup Gin router
	r := gin.Default()

	// CORS middleware could be added here

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Setup API routes
	api := r.Group("/api/v1")
	{
		auth.RegisterRoutes(api)

		// Protected routes
		protected := api.Group("")
		protected.Use(auth.Middleware())
		{
			portfolios.RegisterRoutes(protected)
			portfolios.RegisterExportRoutes(protected)
			categories.RegisterRoutes(protected)
			transactions.RegisterRoutes(protected)
		}
	}

	// Start server
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}
	r.Run(":" + port)
}
