package main

import (
	"fmt"
	"kasku-backend/pkg/database"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "postgres://postgres.buvdomoitatpuqcrctmq:jVbz7QcU4ozjpjFR@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	// Drop portfolio_id constraint and column
	err = db.Exec("ALTER TABLE categories DROP COLUMN IF EXISTS portfolio_id CASCADE;").Error
	if err != nil {
		fmt.Println("Error dropping column:", err)
	} else {
		fmt.Println("Column dropped successfully")
	}

	// AutoMigrate will add user_id
	err = db.AutoMigrate(&database.Category{})
	if err != nil {
		fmt.Println("Error migrating:", err)
	} else {
		fmt.Println("Migrated successfully")
	}
}
