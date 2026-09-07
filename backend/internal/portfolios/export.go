package portfolios

import (
	"bytes"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"kasku-backend/pkg/database"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
)

func RegisterExportRoutes(router *gin.RouterGroup) {
	group := router.Group("/portfolios/:id/export")
	{
		group.GET("/pdf", exportPDF)
		group.GET("/excel", exportExcel)
	}
}

// Helper untuk format IDR
func formatIDR(amount float64) string {
	isNegative := amount < 0
	if isNegative {
		amount = -amount
	}
	s := fmt.Sprintf("%.0f", amount)
	
	var res string
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			res += "."
		}
		res += string(c)
	}
	
	if isNegative {
		return "-Rp " + res
	}
	return "Rp " + res
}

func checkAccessAndGetTransactions(c *gin.Context) (database.Portfolio, float64, []database.Transaction, error) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", id, userID).First(&member).Error; err != nil {
		return database.Portfolio{}, 0, nil, fmt.Errorf("akses ditolak")
	}

	var portfolio database.Portfolio
	if err := database.DB.First(&portfolio, "id = ?", id).Error; err != nil {
		return database.Portfolio{}, 0, nil, fmt.Errorf("portofolio tidak ditemukan")
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	categoryID := c.Query("category_id")
	txType := c.Query("type")

	// Calculate initial balance (saldo awal) - transactions before start_date
	var initialBalance float64 = 0
	if startDate != "" {
		var priorTx []database.Transaction
		database.DB.Where("portfolio_id = ? AND date < ?", id, startDate).Find(&priorTx)
		for _, t := range priorTx {
			if t.Type == "income" {
				initialBalance += t.Amount
			} else {
				initialBalance -= t.Amount
			}
		}
	}

	query := database.DB.Preload("Category").Preload("Creator").Where("portfolio_id = ?", id)

	if startDate != "" {
		query = query.Where("date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("date <= ?", endDate)
	}
	if categoryID != "" && categoryID != "all" {
		query = query.Where("category_id = ?", categoryID)
	}
	if txType != "" && txType != "all" {
		query = query.Where("type = ?", txType)
	}

	var transactions []database.Transaction
	// Sort ASC so running balance can be calculated properly
	if err := query.Order("date asc, created_at asc").Find(&transactions).Error; err != nil {
		return database.Portfolio{}, 0, nil, fmt.Errorf("gagal mengambil transaksi")
	}

	return portfolio, initialBalance, transactions, nil
}

func exportPDF(c *gin.Context) {
	portfolio, initialBalance, transactions, err := checkAccessAndGetTransactions(c)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	pdf := gofpdf.New("L", "mm", "A4", "") // L for landscape
	pdf.AddPage()
	
	// Header Info
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Laporan Mutasi KasKu")
	pdf.Ln(8)
	
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(40, 6, fmt.Sprintf("Portofolio: %s", portfolio.Name))
	pdf.Ln(6)
	
	periodStr := "Semua Waktu"
	if c.Query("start_date") != "" && c.Query("end_date") != "" {
		periodStr = fmt.Sprintf("%s s/d %s", c.Query("start_date"), c.Query("end_date"))
	}
	pdf.Cell(40, 6, fmt.Sprintf("Periode: %s", periodStr))
	pdf.Ln(6)
	
	pdf.Cell(40, 6, fmt.Sprintf("Dicetak pada: %s", time.Now().Format("02-01-2006 15:04:05")))
	pdf.Ln(6)
	
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(40, 6, fmt.Sprintf("Saldo Awal: %s", formatIDR(initialBalance)))
	pdf.Ln(10)

	// Columns: No, Tanggal, Kategori, Keterangan, Pemasukan, Pengeluaran, Saldo Berjalan, Dicatat Oleh
	// Widths: 10, 25, 35, 60, 35, 35, 35, 40 => Total 275mm (A4 Landscape is 297mm, margins 10+10, 277mm usable)
	
	colW := []float64{10, 25, 35, 60, 35, 35, 35, 40}
	
	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(colW[0], 10, "No", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[1], 10, "Tanggal", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[2], 10, "Kategori", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[3], 10, "Keterangan", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[4], 10, "Pemasukan", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[5], 10, "Pengeluaran", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[6], 10, "Saldo", "1", 0, "C", false, 0, "")
	pdf.CellFormat(colW[7], 10, "Dicatat Oleh", "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	pdf.SetFont("Arial", "", 9) // Sedikit lebih kecil agar muat panjang
	
	runningBalance := initialBalance
	totalIncome := 0.0
	totalExpense := 0.0
	
	for i, t := range transactions {
		inAmt := "-"
		outAmt := "-"
		if t.Type == "income" {
			runningBalance += t.Amount
			totalIncome += t.Amount
			inAmt = formatIDR(t.Amount)
		} else {
			runningBalance -= t.Amount
			totalExpense += t.Amount
			outAmt = formatIDR(t.Amount)
		}
		
		userName := t.Creator.Name
		if len(userName) > 20 {
			userName = userName[:17] + "..."
		}
		
		desc := t.Description
		if len(desc) > 35 {
			desc = desc[:32] + "..."
		}
		
		pdf.CellFormat(colW[0], 8, strconv.Itoa(i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colW[1], 8, t.Date.Format("02-01-2006"), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colW[2], 8, t.Category.Name, "1", 0, "L", false, 0, "")
		pdf.CellFormat(colW[3], 8, desc, "1", 0, "L", false, 0, "")
		pdf.CellFormat(colW[4], 8, inAmt, "1", 0, "R", false, 0, "")
		pdf.CellFormat(colW[5], 8, outAmt, "1", 0, "R", false, 0, "")
		pdf.CellFormat(colW[6], 8, formatIDR(runningBalance), "1", 0, "R", false, 0, "")
		pdf.CellFormat(colW[7], 8, userName, "1", 0, "L", false, 0, "")
		pdf.Ln(-1)
	}

	pdf.Ln(4)
	pdf.SetFont("Arial", "B", 10)
	pdf.Cell(60, 6, fmt.Sprintf("Total Pemasukan: %s", formatIDR(totalIncome)))
	pdf.Ln(6)
	pdf.Cell(60, 6, fmt.Sprintf("Total Pengeluaran: %s", formatIDR(totalExpense)))
	pdf.Ln(6)
	pdf.Cell(60, 6, fmt.Sprintf("Selisih Periode: %s", formatIDR(totalIncome - totalExpense)))
	pdf.Ln(6)
	pdf.Cell(60, 6, fmt.Sprintf("Saldo Akhir: %s", formatIDR(runningBalance)))
	
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate PDF"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=laporan-mutasi.pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

func exportExcel(c *gin.Context) {
	portfolio, initialBalance, transactions, err := checkAccessAndGetTransactions(c)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {}
	}()

	sheetName := "Sheet1"
	
	// Header Info
	f.SetCellValue(sheetName, "A1", "Laporan Mutasi KasKu")
	f.SetCellValue(sheetName, "A2", fmt.Sprintf("Portofolio: %s", portfolio.Name))
	
	periodStr := "Semua Waktu"
	if c.Query("start_date") != "" && c.Query("end_date") != "" {
		periodStr = fmt.Sprintf("%s s/d %s", c.Query("start_date"), c.Query("end_date"))
	}
	f.SetCellValue(sheetName, "A3", fmt.Sprintf("Periode: %s", periodStr))
	f.SetCellValue(sheetName, "A4", fmt.Sprintf("Dicetak pada: %s", time.Now().Format("02-01-2006 15:04:05")))
	f.SetCellValue(sheetName, "A5", fmt.Sprintf("Saldo Awal: %s", formatIDR(initialBalance)))

	// Headers table
	row := 7
	f.SetCellValue(sheetName, "A"+strconv.Itoa(row), "No")
	f.SetCellValue(sheetName, "B"+strconv.Itoa(row), "Tanggal")
	f.SetCellValue(sheetName, "C"+strconv.Itoa(row), "Kategori")
	f.SetCellValue(sheetName, "D"+strconv.Itoa(row), "Keterangan")
	f.SetCellValue(sheetName, "E"+strconv.Itoa(row), "Pemasukan")
	f.SetCellValue(sheetName, "F"+strconv.Itoa(row), "Pengeluaran")
	f.SetCellValue(sheetName, "G"+strconv.Itoa(row), "Saldo Berjalan")
	f.SetCellValue(sheetName, "H"+strconv.Itoa(row), "Dicatat Oleh")
	
	runningBalance := initialBalance
	totalIncome := 0.0
	totalExpense := 0.0

	for i, t := range transactions {
		row++
		
		var inAmt, outAmt *float64
		if t.Type == "income" {
			runningBalance += t.Amount
			totalIncome += t.Amount
			inAmt = &t.Amount
		} else {
			runningBalance -= t.Amount
			totalExpense += t.Amount
			outAmt = &t.Amount
		}

		f.SetCellValue(sheetName, "A"+strconv.Itoa(row), i+1)
		f.SetCellValue(sheetName, "B"+strconv.Itoa(row), t.Date.Format("02-01-2006"))
		f.SetCellValue(sheetName, "C"+strconv.Itoa(row), t.Category.Name)
		f.SetCellValue(sheetName, "D"+strconv.Itoa(row), t.Description)
		
		if inAmt != nil {
			f.SetCellValue(sheetName, "E"+strconv.Itoa(row), *inAmt)
		}
		if outAmt != nil {
			f.SetCellValue(sheetName, "F"+strconv.Itoa(row), *outAmt)
		}
		f.SetCellValue(sheetName, "G"+strconv.Itoa(row), runningBalance)
		f.SetCellValue(sheetName, "H"+strconv.Itoa(row), t.Creator.Name)
	}

	row += 2
	f.SetCellValue(sheetName, "F"+strconv.Itoa(row), "Total Pemasukan:")
	f.SetCellValue(sheetName, "G"+strconv.Itoa(row), totalIncome)
	row++
	f.SetCellValue(sheetName, "F"+strconv.Itoa(row), "Total Pengeluaran:")
	f.SetCellValue(sheetName, "G"+strconv.Itoa(row), totalExpense)
	row++
	f.SetCellValue(sheetName, "F"+strconv.Itoa(row), "Selisih Periode:")
	f.SetCellValue(sheetName, "G"+strconv.Itoa(row), totalIncome - totalExpense)
	row++
	f.SetCellValue(sheetName, "F"+strconv.Itoa(row), "Saldo Akhir:")
	f.SetCellValue(sheetName, "G"+strconv.Itoa(row), runningBalance)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate Excel"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=laporan-mutasi.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
