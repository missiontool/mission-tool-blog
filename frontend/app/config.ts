// 這裡運用了 "短路求值" 的技巧：
// 1. 如果系統有設定 NEXT_PUBLIC_API_URL (在 Vercel 雲端)，就用雲端的。
// 2. 如果沒有設定 (在自己電腦)，就預設用 localhost:8080。
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';