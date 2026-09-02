package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"kasku-backend/pkg/database"
	"kasku-backend/pkg/jwt"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

var googleOauthConfig *oauth2.Config

func initOauthConfig() {
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirectURL == "" {
		// Default to local for development if not set in Northflank yet
		redirectURL = "http://localhost:8080/api/v1/auth/google/callback"
	}

	googleOauthConfig = &oauth2.Config{
		RedirectURL:  redirectURL,
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

// generateStateOauthCookie generates a random state and sets it as a cookie
func generateStateOauthCookie(c *gin.Context) string {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)
	c.SetCookie("oauthstate", state, 3600, "/", "", false, true)
	return state
}

func GoogleLogin(c *gin.Context) {
	if googleOauthConfig == nil {
		initOauthConfig()
	}
	
	oauthState := generateStateOauthCookie(c)
	u := googleOauthConfig.AuthCodeURL(oauthState)
	c.Redirect(http.StatusTemporaryRedirect, u)
}

func GoogleCallback(c *gin.Context) {
	if googleOauthConfig == nil {
		initOauthConfig()
	}

	oauthState, _ := c.Cookie("oauthstate")
	if c.Query("state") != oauthState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid oauth google state"})
		return
	}

	data, err := getUserDataFromGoogle(c.Query("code"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user data from google: " + err.Error()})
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
			Password: "", // No password for OAuth users
		}
		
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// Create default portfolio
		defaultPortfolio := database.Portfolio{
			Name:    "Portofolio Utama",
			OwnerID: user.ID,
			Color:   "#4F46E5",
		}
		database.DB.Create(&defaultPortfolio)
		
		database.DB.Create(&database.PortfolioMember{
			PortfolioID: defaultPortfolio.ID,
			UserID:      user.ID,
			Role:        "owner",
		})
	}

	// Generate JWT Token
	token, err := jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Redirect back to frontend with the token
	redirectUrl := fmt.Sprintf("%s/api/auth/callback?token=%s", frontendURL, token)
	c.Redirect(http.StatusTemporaryRedirect, redirectUrl)
}

func getUserDataFromGoogle(code string) ([]byte, error) {
	// Use code to get token and get user info from Google.
	token, err := googleOauthConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("code exchange wrong: %s", err.Error())
	}
	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed getting user info: %s", err.Error())
	}
	defer response.Body.Close()
	contents, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, fmt.Errorf("failed read response: %s", err.Error())
	}
	return contents, nil
}
