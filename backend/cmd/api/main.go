package main

import (
	"log"
	"os"

	"kasku-backend/internal/analytics"
	"kasku-backend/internal/auth"
	"kasku-backend/internal/categories"
	"kasku-backend/internal/portfolios"
	"kasku-backend/internal/transactions"
	"kasku-backend/pkg/database"

	"github.com/gin-contrib/cors"
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

	// CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Setup API routes
	api := r.Group("/api/v1")
	{
		auth.RegisterRoutes(api)
		portfolios.RegisterPublicRoutes(api)

		protected := api.Group("")
		protected.Use(auth.Middleware())
		{
			protected.GET("/auth/me", auth.GetMe)
			portfolios.RegisterRoutes(protected)
			portfolios.RegisterExportRoutes(protected)
			categories.RegisterRoutes(protected)
			transactions.RegisterRoutes(protected)
			analytics.RegisterRoutes(protected)
		}
	}

	// Start server
	port := "8080"
	if p := os.Getenv("PORT"); p != "" {
		port = p
	}
	r.Run(":" + port)
}
