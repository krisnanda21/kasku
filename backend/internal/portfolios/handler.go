package portfolios

import (
	"net/http"

	"kasku-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	group := router.Group("/portfolios")
	{
		group.GET("", getPortfolios)
		group.POST("", createPortfolio)
		group.GET("/:id", getPortfolioDetail)
		group.PUT("/:id", updatePortfolio)
		group.DELETE("/:id", deletePortfolio)
	}
}

func getPortfolios(c *gin.Context) {
	userID := c.GetString("user_id")

	var memberLinks []database.PortfolioMember
	if err := database.DB.Preload("Portfolio").Where("user_id = ?", userID).Find(&memberLinks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data portofolio"})
		return
	}

	var portfolios []database.Portfolio
	for _, link := range memberLinks {
		portfolios = append(portfolios, link.Portfolio)
	}

	c.JSON(http.StatusOK, gin.H{"data": portfolios})
}

type CreatePortfolioInput struct {
	Name  string `json:"name" binding:"required"`
	Color string `json:"color"`
}

func createPortfolio(c *gin.Context) {
	userID := c.GetString("user_id")

	var input CreatePortfolioInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Color == "" {
		input.Color = "#000000"
	}

	portfolio := database.Portfolio{
		Name:    input.Name,
		Color:   input.Color,
		OwnerID: userID,
	}

	tx := database.DB.Begin()

	if err := tx.Create(&portfolio).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat portofolio"})
		return
	}

	member := database.PortfolioMember{
		PortfolioID: portfolio.ID,
		UserID:      userID,
		Role:        "owner",
	}

	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambahkan role portofolio"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{"data": portfolio})
}

func getPortfolioDetail(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	// Cek akses member
	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", id, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": portfolio, "role": member.Role})
}

func updatePortfolio(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat mengubah portofolio"})
		return
	}

	var input CreatePortfolioInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	portfolio.Name = input.Name
	portfolio.Color = input.Color

	if err := database.DB.Save(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update portofolio"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": portfolio})
}

func deletePortfolio(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat menghapus portofolio"})
		return
	}

	if err := database.DB.Delete(&portfolio).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus portofolio"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Portofolio dihapus"})
}
