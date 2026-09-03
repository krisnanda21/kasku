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
	userID := c.GetString("user_id")

	var categories []database.Category
	if err := database.DB.Where("user_id = ?", userID).Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil kategori"})
		return
	}

	if len(categories) == 0 {
		defaultCategories := []database.Category{
			{UserID: userID, Name: "Makanan", Type: "expense"},
			{UserID: userID, Name: "Transportasi", Type: "expense"},
			{UserID: userID, Name: "Hiburan", Type: "expense"},
			{UserID: userID, Name: "Tagihan", Type: "expense"},
			{UserID: userID, Name: "Gaji", Type: "income"},
			{UserID: userID, Name: "Bonus", Type: "income"},
			{UserID: userID, Name: "Investasi", Type: "income"},
		}
		if err := database.DB.Create(&defaultCategories).Error; err == nil {
			categories = defaultCategories
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": categories})
}

type CreateCategoryInput struct {
	Name string `json:"name" binding:"required"`
	Type string `json:"type" binding:"required,oneof=income expense"`
}

func createCategory(c *gin.Context) {
	userID := c.GetString("user_id")

	var input CreateCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category := database.Category{
		UserID: userID,
		Name:   input.Name,
		Type:   input.Type,
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
