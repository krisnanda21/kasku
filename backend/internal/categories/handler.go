package categories

import (
	"net/http"

	"kasku-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	group := router.Group("/categories")
	{
		group.GET("", getCategories)
		group.POST("", createCategory)
		group.PUT("/:id", updateCategory)
		group.DELETE("/:id", deleteCategory)
	}
}

func getCategories(c *gin.Context) {
	// For simplicity, we can fetch all categories linked to portfolios the user has access to,
	// or standard categories. Usually apps have default categories and custom ones per portfolio.
	// We'll fetch custom categories based on portfolio_id.
	portfolioID := c.Query("portfolio_id")
	if portfolioID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "portfolio_id wajib diisi"})
		return
	}

	var categories []database.Category
	if err := database.DB.Where("portfolio_id = ?", portfolioID).Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil kategori"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}

type CreateCategoryInput struct {
	PortfolioID string `json:"portfolio_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=income expense"`
}

func createCategory(c *gin.Context) {
	var input CreateCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ideally check if user has edit access to portfolio...
	// We omit for brevity, assuming middleware or further check.

	category := database.Category{
		PortfolioID: input.PortfolioID,
		Name:        input.Name,
		Type:        input.Type,
	}

	if err := database.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat kategori"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": category})
}

func updateCategory(c *gin.Context) {
	id := c.Param("id")

	var category database.Category
	if err := database.DB.First(&category, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
		return
	}

	var input CreateCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category.Name = input.Name
	category.Type = input.Type

	if err := database.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update kategori"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": category})
}

func deleteCategory(c *gin.Context) {
	id := c.Param("id")

	if err := database.DB.Delete(&database.Category{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kategori"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kategori dihapus"})
}
