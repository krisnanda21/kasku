package transactions

import (
	"net/http"
	"time"

	"kasku-backend/pkg/database"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.RouterGroup) {
	group := router.Group("/portfolios/:id/transactions")
	{
		group.GET("", getTransactions)
		group.POST("", createTransaction)
	group.GET("/:transaction_id", getTransactionDetail)
		group.PUT("/:transaction_id", updateTransaction)
		group.DELETE("/:transaction_id", deleteTransaction)
	}
}

func getTransactions(c *gin.Context) {
	portfolioID := c.Param("id")

	var transactions []database.Transaction
	if err := database.DB.Where("portfolio_id = ?", portfolioID).Order("date desc, created_at desc").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

type CreateTransactionInput struct {
	CategoryID  string    `json:"category_id" binding:"required"`
	Amount      float64   `json:"amount" binding:"required,gt=0"`
	Type        string    `json:"type" binding:"required,oneof=income expense"`
	Date        time.Time `json:"date" binding:"required"`
	Description string    `json:"description"`
	ReceiptURL  string    `json:"receipt_url"`
}

func createTransaction(c *gin.Context) {
	portfolioID := c.Param("id")

	var input CreateTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	transaction := database.Transaction{
		PortfolioID: portfolioID,
		CategoryID:  input.CategoryID,
		Amount:      input.Amount,
		Type:        input.Type,
		Date:        input.Date,
		Description: input.Description,
		ReceiptURL:  input.ReceiptURL,
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mencatat transaksi"})
		return
	}

	// Update portfolio balance
	var portfolio database.Portfolio
	if err := tx.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if input.Type == "income" {
		portfolio.Balance += input.Amount
	} else {
		portfolio.Balance -= input.Amount
	}

	if err := tx.Save(&portfolio).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update saldo portofolio"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"data": transaction})
}

func getTransactionDetail(c *gin.Context) {
	id := c.Param("transaction_id")

	var transaction database.Transaction
	if err := database.DB.Preload("Category").First(&transaction, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

func updateTransaction(c *gin.Context) {
	// Omitted for brevity: Should handle balance recalculation logic
	c.JSON(http.StatusNotImplemented, gin.H{"message": "Fitur update akan datang"})
}

func deleteTransaction(c *gin.Context) {
	id := c.Param("transaction_id")
	portfolioID := c.Param("id")

	tx := database.DB.Begin()

	var transaction database.Transaction
	if err := tx.First(&transaction, "id = ?", id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	// Revert balance
	var portfolio database.Portfolio
	if err := tx.First(&portfolio, "id = ?", portfolioID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Portofolio tidak ditemukan"})
		return
	}

	if transaction.Type == "income" {
		portfolio.Balance -= transaction.Amount
	} else {
		portfolio.Balance += transaction.Amount
	}
	if err := tx.Save(&portfolio).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update saldo portofolio"})
		return
	}

	if err := tx.Delete(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus transaksi"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Transaksi dihapus"})
}
