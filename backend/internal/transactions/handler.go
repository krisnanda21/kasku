package transactions

import (
	"encoding/json"
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
		group.GET("/:transaction_id/logs", getTransactionLogs)
	}
}

func getTransactions(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	if !checkAccess(portfolioID, userID, false) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	query := database.DB.Where("portfolio_id = ?", portfolioID)

	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("date <= ?", endDate)
	}
	if txType := c.Query("type"); txType != "" {
		query = query.Where("type = ?", txType)
	}
	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	var transactions []database.Transaction
	if err := query.Preload("Category").Order("date desc, created_at desc").Find(&transactions).Error; err != nil {
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
}

func createTransaction(c *gin.Context) {
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	if !checkAccess(portfolioID, userID, true) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Membutuhkan hak akses edit"})
		return
	}

	var input CreateTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	transaction := database.Transaction{
		PortfolioID: portfolioID,
		CategoryID:  input.CategoryID,
		CreatedBy:   userID,
		Amount:      input.Amount,
		Type:        input.Type,
		Date:        input.Date,
		Description: input.Description,
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

	// Audit Log
	newValuesJSON, _ := json.Marshal(transaction)
	if err := tx.Create(&database.TransactionLog{
		TransactionID: transaction.ID,
		ChangedBy:     userID,
		Action:        "create",
		OldValues:     "{}",
		NewValues:     string(newValuesJSON),
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan log transaksi"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"data": transaction})
}

func getTransactionDetail(c *gin.Context) {
	id := c.Param("transaction_id")
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	if !checkAccess(portfolioID, userID, false) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	var transaction database.Transaction
	if err := database.DB.Preload("Category").First(&transaction, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

type UpdateTransactionInput struct {
	CategoryID  string    `json:"category_id" binding:"required"`
	Amount      float64   `json:"amount" binding:"required,gt=0"`
	Type        string    `json:"type" binding:"required,oneof=income expense"`
	Date        time.Time `json:"date" binding:"required"`
	Description string    `json:"description"`
}

func updateTransaction(c *gin.Context) {
	id := c.Param("transaction_id")
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	if !checkAccess(portfolioID, userID, true) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Membutuhkan hak akses edit"})
		return
	}

	var input UpdateTransactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var transaction database.Transaction
	if err := tx.First(&transaction, "id = ?", id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	oldValuesJSON, _ := json.Marshal(transaction)

	// Revert old balance
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

	// Update fields
	transaction.CategoryID = input.CategoryID
	transaction.Amount = input.Amount
	transaction.Type = input.Type
	transaction.Date = input.Date
	transaction.Description = input.Description

	if err := tx.Save(&transaction).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update transaksi"})
		return
	}

	// Apply new balance
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

	// Audit Log
	newValuesJSON, _ := json.Marshal(transaction)
	if err := tx.Create(&database.TransactionLog{
		TransactionID: transaction.ID,
		ChangedBy:     userID,
		Action:        "update",
		OldValues:     string(oldValuesJSON),
		NewValues:     string(newValuesJSON),
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan log transaksi"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

func deleteTransaction(c *gin.Context) {
	id := c.Param("transaction_id")
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	if !checkAccess(portfolioID, userID, true) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Membutuhkan hak akses edit"})
		return
	}

	tx := database.DB.Begin()

	var transaction database.Transaction
	if err := tx.First(&transaction, "id = ?", id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	oldValuesJSON, _ := json.Marshal(transaction)

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

	// Audit Log
	if err := tx.Create(&database.TransactionLog{
		TransactionID: transaction.ID,
		ChangedBy:     userID,
		Action:        "delete",
		OldValues:     string(oldValuesJSON),
		NewValues:     "{}",
	}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan log transaksi"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Transaksi dihapus"})
}

func getTransactionLogs(c *gin.Context) {
	id := c.Param("transaction_id")
	portfolioID := c.Param("id")
	userID := c.GetString("user_id")

	if !checkAccess(portfolioID, userID, false) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	var logs []database.TransactionLog
	if err := database.DB.Preload("User").Where("transaction_id = ?", id).Order("created_at desc").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": logs})
}

func checkAccess(portfolioID, userID string, requiresEdit bool) bool {
	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).First(&member).Error; err != nil {
		return false
	}
	if requiresEdit && member.Role != "owner" && member.Role != "edit" {
		return false
	}
	return true
}
