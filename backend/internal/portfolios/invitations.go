package portfolios

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"kasku-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

func generateToken() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func getInvitation(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	// Check if owner
	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat mengakses undangan"})
		return
	}

	var invitation database.PortfolioInvitation
	result := database.DB.Where("portfolio_id = ?", portfolioID).First(&invitation)

	if result.Error != nil {
		// Auto generate if not exists
		invitation = database.PortfolioInvitation{
			PortfolioID: portfolioID,
			Token:       generateToken(),
			Role:        "view",
			IsActive:    true,
			CreatedBy:   userID,
		}
		if err := database.DB.Create(&invitation).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat link undangan"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": invitation})
}

func toggleInvitation(c *gin.Context) {
	portfolioID := c.Param("id")
	token := c.Param("token")
	userID := c.GetString("user_id")

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat mengatur undangan"})
		return
	}

	var invitation database.PortfolioInvitation
	if err := database.DB.Where("portfolio_id = ? AND token = ?", portfolioID, token).First(&invitation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Undangan tidak ditemukan"})
		return
	}

	// Toggle IsActive
	invitation.IsActive = !invitation.IsActive
	if err := database.DB.Save(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan status undangan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": invitation})
}

type UpdateRoleInput struct {
	Role string `json:"role" binding:"required,oneof=view edit"`
}

func updateInvitationRole(c *gin.Context) {
	portfolioID := c.Param("id")
	token := c.Param("token")
	userID := c.GetString("user_id")

	var input UpdateRoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat mengatur undangan"})
		return
	}

	var invitation database.PortfolioInvitation
	if err := database.DB.Where("portfolio_id = ? AND token = ?", portfolioID, token).First(&invitation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Undangan tidak ditemukan"})
		return
	}

	invitation.Role = input.Role
	
	tx := database.DB.Begin()

	if err := tx.Save(&invitation).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan role undangan"})
		return
	}

	// Sinkronisasi role ke semua anggota yang bukan owner
	if err := tx.Model(&database.PortfolioMember{}).
		Where("portfolio_id = ? AND role != 'owner'", portfolioID).
		Update("role", input.Role).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal sinkronisasi role anggota"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"data": invitation})
}

func regenerateInvitation(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat mengatur undangan"})
		return
	}

	// Delete old invitation
	database.DB.Where("portfolio_id = ?", portfolioID).Delete(&database.PortfolioInvitation{})

	// Create new
	invitation := database.PortfolioInvitation{
		PortfolioID: portfolioID,
		Token:       generateToken(),
		Role:        "view",
		IsActive:    true,
		CreatedBy:   userID,
	}

	if err := database.DB.Create(&invitation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat link undangan baru"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": invitation})
}

func getMembers(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat melihat anggota"})
		return
	}

	var members []database.PortfolioMember
	if err := database.DB.Preload("User").Where("portfolio_id = ?", portfolioID).Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar anggota"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": members})
}

func removeMember(c *gin.Context) {
	portfolioID := c.Param("id")
	memberUserID := c.Param("user_id")
	userID := c.GetString("user_id")

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if portfolio.OwnerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya owner yang dapat menghapus anggota"})
		return
	}

	if memberUserID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Owner tidak dapat dikeluarkan"})
		return
	}

	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", portfolioID, memberUserID).Delete(&database.PortfolioMember{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus anggota"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Anggota berhasil dihapus"})
}

func getInvitePreview(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token tidak valid"})
		return
	}

	var invitation database.PortfolioInvitation
	if err := database.DB.Preload("Portfolio").Preload("Portfolio.Owner").Where("token = ? AND is_active = ?", token, true).First(&invitation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link undangan tidak valid atau sudah dinonaktifkan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"portfolio_id":   invitation.PortfolioID,
			"portfolio_name": invitation.Portfolio.Name,
			"owner_name":     invitation.Portfolio.Owner.Name,
			"role":           invitation.Role,
		},
	})
}

type JoinInput struct {
	Token string `json:"token" binding:"required"`
}

func joinPortfolio(c *gin.Context) {
	userID := c.GetString("user_id")

	var input JoinInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var invitation database.PortfolioInvitation
	if err := database.DB.Where("token = ? AND is_active = ?", input.Token, true).First(&invitation).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Link undangan tidak valid atau sudah dinonaktifkan"})
		return
	}

	// Check if already a member
	var member database.PortfolioMember
	err := database.DB.Where("portfolio_id = ? AND user_id = ?", invitation.PortfolioID, userID).First(&member).Error
	if err == nil {
		// Already a member, idempotent
		c.JSON(http.StatusOK, gin.H{"message": "Anda sudah bergabung dengan portofolio ini", "portfolio_id": invitation.PortfolioID})
		return
	}

	// Join
	newMember := database.PortfolioMember{
		PortfolioID: invitation.PortfolioID,
		UserID:      userID,
		Role:        invitation.Role,
	}

	if err := database.DB.Create(&newMember).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal bergabung ke portofolio"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil bergabung", "portfolio_id": invitation.PortfolioID})
}
