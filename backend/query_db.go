package main

import (
	"fmt"
	"kasku-backend/pkg/database"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "postgres://postgres.buvdomoitatpuqcrctmq:jVbz7QcU4ozjpjFR@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
	// PreferSimpleProtocol is required for PgBouncer
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	var portfolios []database.Portfolio
	db.Joins("JOIN portfolio_members ON portfolios.id = portfolio_members.portfolio_id").Find(&portfolios)

	var members []database.PortfolioMember
	db.Find(&members)

	for _, p := range portfolios {
		fmt.Printf("Portfolio ID: '%s', Name: '%s'\n", p.ID, p.Name)
	}
	
	for _, m := range members {
		fmt.Printf("Member ID: '%s', PortfolioID: '%s'\n", m.ID, m.PortfolioID)
	}
}
