package analytics

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"kasku-backend/pkg/database"
)

type AnalyticsHandler struct{}

func NewHandler() *AnalyticsHandler {
	return &AnalyticsHandler{}
}

func RegisterRoutes(router *gin.RouterGroup) {
	h := NewHandler()
	
	// Analytics endpoints
	router.GET("/portfolios/:id/analytics/summary", h.GetSummary)
	router.GET("/portfolios/:id/analytics/trend", h.GetTrend)
	router.GET("/portfolios/:id/analytics/category", h.GetCategory)
	router.GET("/portfolios/:id/analytics/top-transactions", h.GetTopTransactions)
}

func (h *AnalyticsHandler) GetSummary(c *gin.Context) {
	portfolioID := c.Param("id")
	userID, _ := c.Get("user_id")

	// Verify access
	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var currentBalance float64
	// get actual portfolio balance
	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", portfolioID).Error; err == nil {
		currentBalance = portfolio.Balance
	}

	// Prepare time parsing
	var startT, endT time.Time
	var err error
	if startDate != "" {
		startT, err = time.Parse("2006-01-02", startDate)
		if err != nil { startT = time.Time{} }
	}
	if endDate != "" {
		endT, err = time.Parse("2006-01-02", endDate)
		if err != nil { endT = time.Time{} }
	}

	// Calculate total income and expense in the period
	query := database.DB.Model(&database.Transaction{}).Where("portfolio_id = ?", portfolioID)
	
	if !startT.IsZero() {
		query = query.Where("date >= ?", startT)
	}
	if !endT.IsZero() {
		query = query.Where("date <= ?", endT)
	}

	type Result struct {
		Type  string
		Total float64
		Count int64
	}

	var results []Result
	query.Select("type, sum(amount) as total, count(id) as count").Group("type").Scan(&results)

	var totalIncome float64
	var totalExpense float64
	var totalTransactions int64

	for _, r := range results {
		totalTransactions += r.Count
		if r.Type == "income" {
			totalIncome = r.Total
		} else if r.Type == "expense" {
			totalExpense = r.Total
		}
	}

	// Calculate top category for expense
	type TopCat struct {
		Category string
		Total    float64
	}
	var topExpenseCategory TopCat
	queryCat := database.DB.Model(&database.Transaction{}).
		Joins("JOIN categories ON transactions.category_id = categories.id").
		Where("transactions.portfolio_id = ? AND transactions.type = 'expense'", portfolioID)
	
	if !startT.IsZero() { queryCat = queryCat.Where("transactions.date >= ?", startT) }
	if !endT.IsZero() { queryCat = queryCat.Where("transactions.date <= ?", endT) }

	queryCat.Select("categories.name as category, sum(transactions.amount) as total").
		Group("categories.id, categories.name").
		Order("total DESC").
		Limit(1).
		Scan(&topExpenseCategory)

	// Calculate trends (previous period)
	var prevIncome float64 = 0
	var prevExpense float64 = 0
	
	if !startT.IsZero() && !endT.IsZero() {
		// Determine previous period
		// Special case: if startT is Jan 1st, we compare with last year same period
		var prevStartT, prevEndT time.Time
		if startT.Month() == 1 && startT.Day() == 1 {
			prevStartT = startT.AddDate(-1, 0, 0)
			prevEndT = endT.AddDate(-1, 0, 0)
		} else {
			// Dynamic duration
			days := int(endT.Sub(startT).Hours() / 24)
			prevEndT = startT.AddDate(0, 0, -1)
			prevStartT = prevEndT.AddDate(0, 0, -days)
		}

		var prevResults []Result
		database.DB.Model(&database.Transaction{}).
			Where("portfolio_id = ? AND date >= ? AND date <= ?", portfolioID, prevStartT, prevEndT).
			Select("type, sum(amount) as total").
			Group("type").
			Scan(&prevResults)
		
		for _, r := range prevResults {
			if r.Type == "income" { prevIncome = r.Total }
			if r.Type == "expense" { prevExpense = r.Total }
		}
	}

	calculateTrend := func(current, prev float64) float64 {
		if prev == 0 {
			if current > 0 { return 100 }
			return 0
		}
		return ((current - prev) / prev) * 100
	}

	c.JSON(http.StatusOK, gin.H{
		"balance": currentBalance,
		"income":  totalIncome,
		"expense": totalExpense,
		"net":     totalIncome - totalExpense,
		"total_transactions": totalTransactions,
		"top_expense_category": topExpenseCategory.Category,
		"top_expense_amount": topExpenseCategory.Total,
		"trend": gin.H{
			"income": calculateTrend(totalIncome, prevIncome),
			"expense": calculateTrend(totalExpense, prevExpense),
			"net": calculateTrend(totalIncome - totalExpense, prevIncome - prevExpense),
			// Balance trend doesn't make as much sense with time periods unless we track historical balance,
			// but we can just use 0 or omit it. The user mentioned "Saldo naik/turun", so maybe they want it. 
			// We don't have historical balance snapshots, so we omit balance trend.
		},
	})
}

func (h *AnalyticsHandler) GetTopTransactions(c *gin.Context) {
	portfolioID := c.Param("id")
	userID, _ := c.Get("user_id")

	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := database.DB.Model(&database.Transaction{}).
		Preload("Category").
		Where("portfolio_id = ?", portfolioID)

	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("date >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("date <= ?", t)
		}
	}

	var transactions []database.Transaction
	// Order by amount DESC to get the largest transactions (both income and expense)
	query.Order("amount DESC").Limit(5).Find(&transactions)

	c.JSON(http.StatusOK, gin.H{
		"data": transactions,
	})
}

func (h *AnalyticsHandler) GetTrend(c *gin.Context) {
	portfolioID := c.Param("id")
	userID, _ := c.Get("user_id")

	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := database.DB.Model(&database.Transaction{}).Where("portfolio_id = ?", portfolioID)
	
	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("date >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("date <= ?", t)
		}
	}

	type TrendResult struct {
		Date  string  `json:"date"`
		Type  string  `json:"type"`
		Total float64 `json:"total"`
	}

	var results []TrendResult
	// Postgres dialect specific date extraction
	query.Select("TO_CHAR(date, 'YYYY-MM-DD') as date, type, sum(amount) as total").
		Group("TO_CHAR(date, 'YYYY-MM-DD'), type").
		Order("date ASC").
		Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"data": results,
	})
}

func (h *AnalyticsHandler) GetCategory(c *gin.Context) {
	portfolioID := c.Param("id")
	userID, _ := c.Get("user_id")

	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", portfolioID, userID).First(&member).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak"})
		return
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := database.DB.Model(&database.Transaction{}).
		Joins("LEFT JOIN categories ON categories.id = transactions.category_id").
		Where("transactions.portfolio_id = ?", portfolioID)
	
	if startDate != "" {
		if t, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("transactions.date >= ?", t)
		}
	}
	if endDate != "" {
		if t, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("transactions.date <= ?", t)
		}
	}

	type CategoryResult struct {
		CategoryName string  `json:"category"`
		Type         string  `json:"type"`
		Total        float64 `json:"total"`
	}

	var results []CategoryResult
	query.Select("categories.name as category_name, transactions.type, sum(transactions.amount) as total").
		Group("categories.name, transactions.type").
		Order("total DESC").
		Scan(&results)

	c.JSON(http.StatusOK, gin.H{
		"data": results,
	})
}
