package database

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	Name      string         `json:"name"`
	GoogleID  *string        `gorm:"uniqueIndex" json:"google_id,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Portfolio struct {
	ID        string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Color     string         `gorm:"default:'#000000'" json:"color"`
	OwnerID   string         `gorm:"type:uuid;not null;index" json:"owner_id"`
	Owner     User           `gorm:"foreignKey:OwnerID" json:"owner"`
	Balance   float64        `gorm:"default:0" json:"balance"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type PortfolioMember struct {
	ID          string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PortfolioID string         `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	Portfolio   Portfolio      `gorm:"foreignKey:PortfolioID" json:"portfolio"`
	UserID      string         `gorm:"type:uuid;not null;index" json:"user_id"`
	User        User           `gorm:"foreignKey:UserID" json:"user"`
	Role        string         `gorm:"not null" json:"role"` // 'view', 'edit'
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Category struct {
	ID          string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PortfolioID string         `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	Name        string         `gorm:"not null" json:"name"`
	Type        string         `gorm:"not null" json:"type"` // 'income', 'expense'
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type Transaction struct {
	ID          string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	PortfolioID string         `gorm:"type:uuid;not null;index" json:"portfolio_id"`
	CategoryID  string         `gorm:"type:uuid;not null;index" json:"category_id"`
	Category    Category       `gorm:"foreignKey:CategoryID" json:"category"`
	Amount      float64        `gorm:"not null" json:"amount"`
	Type        string         `gorm:"not null" json:"type"` // 'income', 'expense'
	Date        time.Time      `gorm:"type:date;not null" json:"date"`
	Description string         `json:"description"`
	ReceiptURL  string         `json:"receipt_url"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func Migrate() {
	DB.AutoMigrate(
		&User{},
		&Portfolio{},
		&PortfolioMember{},
		&Category{},
		&Transaction{},
	)
}
