package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	// 讀取系統環境變數
	// 跨域套件，用來處理跨域問題
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// 1. 定義資料結構 (這就像 C# 的 Class)
// gorm.Model 會自動幫妳產生 ID, CreatedAt, UpdatedAt 欄位
type Post struct {
	// gorm.Model
	//  因為原本的欄位首字母是大寫，所以要改成小寫
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	// ---------------------------
	Title    string `json:"title"`
	Content  string `json:"content"`
	Status   string `json:"status"` // 例如: "draft", "published"
	Category string `json:"category"`
}

// 對應資料庫的 Users 表格
type User struct {
	ID       uint   `gorm:"primaryKey"`
	Username string `gorm:"unique"`
	Password string
}

// 用來接收前端傳來的登入請求 (帳號/密碼)
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// 2. 新增資料結構
// binding:"required" 代表如果前端沒傳這個欄位，Gin 會直接報錯擋掉
type CreatePostInput struct {
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Status   string `json:"status"`
	Category string `json:"category" binding:"required"`
}

// 全域資料庫變數
var db *gorm.DB

func main() {
	// 1. 設定資料庫連線
	// 優先讀取環境變數 (雲端使用)
	dsn := os.Getenv("DATABASE_URL")

	// 如果環境變數沒有設定 (本地測試)
	if dsn == "" {
		dsn = "postgresql://postgres.nfuzwzjnwicvcdzhowsu:V8Bwkc%23-4ZU5Dbi@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?default_query_exec_mode=simple_protocol"
	}

	// Host: aws-1-ap-south-1.pooler.supabase.com
	// Port: 6543
	// Database: postgres
	// Username: postgres.nfuzwzjnwicvcdzhowsu
	// Password: V8Bwkc#-4ZU5Dbi

	var err error
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		// 不要自動建立資料表
		PrepareStmt: false,
	})
	if err != nil {
		log.Fatal("大象還在睡 (連線失敗): ", err)
	}
	fmt.Println("成功連線 Supabase！大象醒了！🐘")

	// 3. 自動建立資料表 (Auto Migration)
	// 這行程式碼執行後，Go 會自動去 Supabase 建立一張 'posts' 資料表
	db.AutoMigrate(&Post{})

	// 4. 啟動 Web Server
	r := gin.Default()

	// 設定跨域CORS (注意要放在路由前面)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // 允許所有網域 (開發階段方便)
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// =========== 🌏 公開區 (遊客可以走) ===========

	// 登入 API
	r.POST("/login", func(c *gin.Context) {
		var input LoginRequest

		// 1. 解析前端傳來的 JSON
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "資料格式錯誤"})
			return
		}

		// 2. 去資料庫找這個使用者
		var user User
		if err := db.Where("username = ?", input.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "帳號或密碼錯誤"}) // 故意不說是哪個錯，增加安全性
			return
		}

		// 3. 檢查密碼 (比較 明碼 vs 雜湊碼)
		err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "帳號或密碼錯誤"})
			return
		}

		// 4. 密碼正確！開始發行 JWT (識別證)
		// 設定這張證件的內容 (Claims)
		claims := jwt.MapClaims{
			"sub": user.ID,                               // 使用者 ID
			"exp": time.Now().Add(time.Hour * 24).Unix(), // 過期時間：24小時後
		}

		// 建立 Token 物件
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

		// 簽名 (蓋章) - 這邊需要一個 "密鑰"，我們先讀環境變數，讀不到就用預設值
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			jwtSecret = "secret_key_for_local_dev" // 本機開發用的預設鑰匙
		}

		// 產生字串
		tokenString, err := token.SignedString([]byte(jwtSecret))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "無法產生 Token"})
			return
		}

		// 5. 回傳 Token 給前端
		c.JSON(http.StatusOK, gin.H{
			"token":   tokenString,
			"message": "登入成功",
		})
	})

	// 路由1 首頁
	r.GET("/", func(c *gin.Context) {
		// 測試路由
		c.JSON(http.StatusOK, gin.H{
			"message": "Server is running! 🐘",
		})
	})

	// 路由2 取得所有文章
	r.GET("/posts", func(c *gin.Context) {
		var posts []Post // 1. 準備一個空陣列來裝資料

		// 2. 呼叫 GORM 去資料庫找 (Find) 所有的 Post，並填入 posts 變數
		// result := db.Find(&posts)
		// 這裡加一個 Order desc 讓最新的文章排在最上面
		result := db.Order("created_at desc").Find(&posts)

		// 3. 檢查有沒有發生錯誤
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
			return
		}

		// 4. 把撈到的資料直接轉成 JSON 回傳
		c.JSON(http.StatusOK, gin.H{
			"data":  posts,
			"count": result.RowsAffected, // 順便告訴前端撈到了幾筆
		})
	})

	// 路由3 取得單篇文章
	r.GET("/posts/:id", func(c *gin.Context) {
		id := c.Param("id")
		var post Post
		// result := db.First(&post, id)

		// if result.Error != nil {
		// 	c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
		// 	return
		// }
		if err := db.First(&post, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": post})
	})

	// =========== 🔒 禁區 (只有管理員能進) ===========
	// 這裡使用 Group 來分組，並且掛上 AuthMiddleware 保全
	authorized := r.Group("/")
	authorized.Use(AuthMiddleware())
	{
		// 新增文章
		authorized.POST("/posts", func(c *gin.Context) {
			var post Post
			if err := c.ShouldBindJSON(&post); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// 這裡可以預設狀態
			post.Status = "published"
			// 記得要確保 CreatedAt 會自動生成，通常 Gorm 會處理

			result := db.Create(&post)
			if result.Error != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
				return
			}
			c.JSON(http.StatusOK, post)
		})

		// 修改文章 (PUT) - 這是之前 Day 5 的作業，如果還沒寫可以現在補上
		authorized.PUT("/posts/:id", func(c *gin.Context) {
			id := c.Param("id")
			var post Post
			// 先找原本的
			if err := db.First(&post, id).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "找不到文章"})
				return
			}

			// 接收新的資料
			var input Post
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "資料錯誤"})
				return
			}

			// 更新欄位
			post.Title = input.Title
			post.Content = input.Content
			post.Category = input.Category
			// post.Status = input.Status // 看你想不想開放改狀態

			db.Save(&post)
			c.JSON(http.StatusOK, post)
		})

		// 刪除文章
		authorized.DELETE("/posts/:id", func(c *gin.Context) {
			id := c.Param("id")
			// 真正的物理刪除 (Unscoped)，如果不加 Unscoped 只是軟刪除
			result := db.Unscoped().Delete(&Post{}, id)
			if result.Error != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "刪除成功"})
		})
	}

	// 啟動伺服器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 本機開發時用 8080
	}

	// 讓伺服器監聽指定的 port
	r.Run(":" + port)
}

// 保全函式：檢查 JWT Token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 從 Header 拿 Token
		// 前端傳過來會長這樣 -> Authorization: Bearer <token>
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "未登入，請出示通行證"})
			return
		}

		// 2. 把 "Bearer " 這六個字去掉，只留後面的亂碼
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "通行證格式錯誤"})
			return
		}
		tokenString := parts[1]

		// 3. 解析並驗證 Token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// 驗證簽名演算法是不是原本那個
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			// 取得密鑰 (跟 Login 時用的是同一把)
			jwtSecret := os.Getenv("JWT_SECRET")
			if jwtSecret == "" {
				jwtSecret = "secret_key_for_local_dev"
			}
			return []byte(jwtSecret), nil
		})

		// 4. 判斷結果
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "通行證無效或已過期"})
			return
		}

		// 5. 通行證有效！放行！
		c.Next()
	}
}
