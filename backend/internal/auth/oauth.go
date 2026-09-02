package auth

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"

	"kasku-backend/pkg/database"
	"kasku-backend/pkg/jwt"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleExchangeInput struct {
	Code        string `json:"code" binding:"required"`
	RedirectURI string `json:"redirect_uri" binding:"required"`
}

func GoogleExchange(c *gin.Context) {
	var input GoogleExchangeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Initialize oauth config with the dynamic redirect_uri
	oauthConfig := &oauth2.Config{
		RedirectURL:  input.RedirectURI,
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}

	// Use code to get token and get user info from Google.
	tokenResponse, err := oauthConfig.Exchange(context.Background(), input.Code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange code: " + err.Error()})
		return
	}

	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + tokenResponse.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed getting user info: " + err.Error()})
		return
	}
	defer response.Body.Close()
	data, err := io.ReadAll(response.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed read response: " + err.Error()})
		return
	}

	// data contains email, name, etc.
	var googleUser struct {
		Email         string `json:"email"`
		Name          string `json:"name"`
		VerifiedEmail bool   `json:"verified_email"`
	}

	if err := json.Unmarshal(data, &googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse google response"})
		return
	}

	if !googleUser.VerifiedEmail {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Google email not verified"})
		return
	}

	// Find or Create User
	var user database.User
	result := database.DB.Where("email = ?", googleUser.Email).First(&user)
	
	if result.Error != nil {
		// User does not exist, create new one
		user = database.User{
			Name:     googleUser.Name,
			Email:    googleUser.Email,
			Password: "OAUTH_USER_NO_PASSWORD", // Non-empty so GORM doesn't omit it, preventing NOT NULL error
		}
		
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
			return
		}

		// Create default portfolio
		defaultPortfolio := database.Portfolio{
			Name:    "Portofolio Utama",
			OwnerID: user.ID,
			Color:   "#4F46E5",
		}
		if err := database.DB.Create(&defaultPortfolio).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create portfolio: " + err.Error()})
			return
		}
		
		if err := database.DB.Create(&database.PortfolioMember{
			PortfolioID: defaultPortfolio.ID,
			UserID:      user.ID,
			Role:        "owner",
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create member: " + err.Error()})
			return
		}
	}

	// Generate JWT Token
	token, err := jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Return the token as JSON
	c.JSON(http.StatusOK, gin.H{"token": token})
}
