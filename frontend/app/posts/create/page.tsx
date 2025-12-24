'use client'; // 🔥 關鍵：這一行一定要在最上面！宣告這是客戶端元件

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // 用來跳轉頁面
import Link from 'next/link';

export default function CreatePostPage() {
  const router = useRouter();
  
  // Loading 狀態 (防止使用者連點)
  const [isLoading, setIsLoading] = useState(false);
  
  // 表單資料狀態
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'published',
    category: '' // 預設為空，強迫使用者選擇
  });

  // 處理送出
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 1. 防止網頁原本的重新整理行為
    setIsLoading(true); // 2. 鎖住按鈕，變更文字

    try {
      // 3. 發送 POST 請求給 Go 後端
      const res = await fetch('http://localhost:8080/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('新增失敗');
      }

      // 4. 成功後，跳轉回首頁
      router.push('/'); 
      router.refresh(); // 強制讓首頁重抓資料
      
    } catch (error) {
      alert('發生錯誤，請稍後再試');
      setIsLoading(false); // 解鎖按鈕
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">寫新文章 ✏️</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 標題輸入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="給文章下個好標題..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 分類選擇 (記得改妳想要的分類名稱) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                <select
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                <option value="" disabled>請選擇分類</option>
                <option value="Dev">網頁開發</option>
                <option value="Tools">工具推薦</option>
                <option value="Life">生活雜談</option>
                <option value="Note">學習筆記</option>
                </select>
            </div>

            {/* 狀態選擇 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                <option value="draft">草稿 (Draft)</option>
                <option value="published">發布 (Published)</option>
                </select>
            </div>
          </div>

          {/* 內容輸入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">內文</label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              placeholder="開始寫作..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* 按鈕區 */}
          <div className="flex items-center gap-4 pt-4">
            <Link href="/" className="px-6 py-2 text-gray-500 hover:text-gray-700 transition">
              取消
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-6 py-2 rounded-lg text-white font-medium transition-all ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isLoading ? '儲存中...' : '發布文章'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}