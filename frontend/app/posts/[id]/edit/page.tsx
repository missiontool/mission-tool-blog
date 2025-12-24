'use client';

import { useState, useEffect, use } from 'react'; // use 是 Next.js 15 解開 params 的新招
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '../../../config';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: Client Component 解開 params 的標準寫法
  const { id } = use(params);
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true); // 一開始是載入中
  const [isSaving, setIsSaving] = useState(false);
  
  // 表單資料
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'published',
    category: ''
  });

  // 1. 進入頁面時，先去後端抓「舊資料」
  useEffect(() => {
    fetch(`${API_URL}/posts/${id}`)
      .then(res => res.json())
      .then(data => {
        // 注意：我們的後端回傳格式是 { data: { ... } }
        const post = data.data;
        setFormData({
          title: post.title,
          content: post.content,
          status: post.status,
          category: post.category || '' // 如果舊文章沒分類，給空字串
        });
        setIsLoading(false); // 抓完資料了，解除載入畫面
      })
      .catch(err => {
        alert('讀取文章失敗');
        router.push('/');
      });
  }, [id, router]);

  // 2. 處理送出 (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 注意：這裡是 PUT 方法
      const res = await fetch(`${API_URL}/posts/${id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('更新失敗');

      alert('更新成功！✨');
      router.push(`/posts/${id}`); // 更新完跳回「詳情頁」看結果
      router.refresh();
    } catch (error) {
      alert('發生錯誤');
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">正在搬運舊文章... 🐢</div>;

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">編輯文章 📝</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">標題</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 分類 */}
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
            
            {/* 狀態 */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                <option value="draft">草稿</option>
                <option value="published">發布</option>
                </select>
            </div>
          </div>

          {/* 內容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">內文</label>
            <textarea
              required
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* 按鈕 */}
          <div className="flex items-center gap-4 pt-4">
            <Link href={`/posts/${id}`} className="px-6 py-2 text-gray-500 hover:text-gray-700 transition">
              取消
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              {isSaving ? '儲存中...' : '儲存修改'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}