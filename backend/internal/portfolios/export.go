package portfolios

import (
	"bytes"
	"fmt"
	"net/http"
	"strconv"

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

func checkAccessAndGetTransactions(c *gin.Context) ([]database.Transaction, error) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	var member database.PortfolioMember
	if err := database.DB.Where("portfolio_id = ? AND user_id = ?", id, userID).First(&member).Error; err != nil {
		return nil, fmt.Errorf("akses ditolak")
	}

	var transactions []database.Transaction
	if err := database.DB.Preload("Category").Where("portfolio_id = ?", id).Order("date desc").Find(&transactions).Error; err != nil {
		return nil, fmt.Errorf("gagal mengambil transaksi")
	}

	return transactions, nil
}

func exportPDF(c *gin.Context) {
	transactions, err := checkAccessAndGetTransactions(c)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(40, 10, "Laporan Mutasi KasKu")
	pdf.Ln(12)

	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(30, 10, "Tanggal", "1", 0, "C", false, 0, "")
	pdf.CellFormat(40, 10, "Kategori", "1", 0, "C", false, 0, "")
	pdf.CellFormat(30, 10, "Tipe", "1", 0, "C", false, 0, "")
	pdf.CellFormat(40, 10, "Jumlah (Rp)", "1", 0, "C", false, 0, "")
	pdf.CellFormat(50, 10, "Keterangan", "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	pdf.SetFont("Arial", "", 10)
	for _, t := range transactions {
		pdf.CellFormat(30, 10, t.Date.Format("02-01-2006"), "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, t.Category.Name, "1", 0, "L", false, 0, "")
		pdf.CellFormat(30, 10, t.Type, "1", 0, "C", false, 0, "")
		pdf.CellFormat(40, 10, fmt.Sprintf("%.2f", t.Amount), "1", 0, "R", false, 0, "")
		pdf.CellFormat(50, 10, t.Description, "1", 0, "L", false, 0, "")
		pdf.Ln(-1)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate PDF"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=laporan-mutasi.pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

func exportExcel(c *gin.Context) {
	transactions, err := checkAccessAndGetTransactions(c)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {}
	}()

	sheetName := "Sheet1"
	f.SetCellValue(sheetName, "A1", "Tanggal")
	f.SetCellValue(sheetName, "B1", "Kategori")
	f.SetCellValue(sheetName, "C1", "Tipe")
	f.SetCellValue(sheetName, "D1", "Jumlah (Rp)")
	f.SetCellValue(sheetName, "E1", "Keterangan")

	for i, t := range transactions {
		row := strconv.Itoa(i + 2)
		f.SetCellValue(sheetName, "A"+row, t.Date.Format("02-01-2006"))
		f.SetCellValue(sheetName, "B"+row, t.Category.Name)
		f.SetCellValue(sheetName, "C"+row, t.Type)
		f.SetCellValue(sheetName, "D"+row, t.Amount)
		f.SetCellValue(sheetName, "E"+row, t.Description)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate Excel"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=laporan-mutasi.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
