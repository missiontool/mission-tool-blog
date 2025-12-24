package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	// 讀取系統環境變數
	// 跨域套件，用來處理跨域問題
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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
		result := db.Find(&posts)

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
		result := db.First(&post, id)

		if result.Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": post})
	})

	// 路由4 新增文章 (POST)
	r.POST("/posts", func(c *gin.Context) {
		var input CreatePostInput

		// 1. 綁定並驗證 JSON (檢查必填欄位)
		if err := c.ShouldBindJSON(&input); err != nil {
			// 如果驗證失敗 (例如沒標題)，回傳 400 錯誤
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 2. 建立資料庫物件
		post := Post{
			Title:    input.Title,
			Content:  input.Content,
			Status:   input.Status,
			Category: input.Category, // 把接收到的分類存進去
		}

		// 設定預設狀態
		if post.Status == "" {
			post.Status = "draft"
		}

		// 3. 存入資料庫
		result := db.Create(&post)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
			return
		}

		// 4. 回傳成功建立的資料 (201 Created)
		c.JSON(http.StatusCreated, gin.H{"data": post})
	})

	// 路由5 修改文章 (PUT)
	r.PUT("/posts/:id", func(c *gin.Context) {
		id := c.Param("id")

		// 先檢查文章存不存在
		var post Post
		if err := db.First(&post, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "找不到這篇文章"})
			return
		}

		// 接收新的資料 (這裡我們複用 CreatePostInput，因為欄位一樣)
		var input CreatePostInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 更新欄位
		// Model(&post) 會鎖定我們要改的那一筆，Updates 會把 input 裡面的值填進去
		result := db.Model(&post).Updates(Post{
			Title:    input.Title,
			Content:  input.Content,
			Status:   input.Status,
			Category: input.Category,
		})

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": post})
	})

	// 路由6 刪除文章 (DELETE)
	r.DELETE("/posts/:id", func(c *gin.Context) {
		id := c.Param("id")

		// 直接執行刪除
		// GORM 的 delete 是「軟刪除 (Soft Delete)」，只會標記 deleted_at 時間，資料不會真的消失
		// 這樣比較安全，以後要救回來還有機會
		result := db.Delete(&Post{}, id)

		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "文章已刪除"})
	})

	// 啟動伺服器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // 本機開發時用 8080
	}

	// 讓伺服器監聽指定的 port
	r.Run(":" + port)
}
