'use client'; // 客戶端元件

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_URL } from '../../config';

export default function DeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false); // 👈 新增狀態
  // 👇 新增這個檢查
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  const handleDelete = async () => {
    // 1. 瀏覽器原生的確認視窗
    const confirmed = window.confirm('確定要刪除這篇文章嗎？刪掉就沒囉！😱');
    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // 從 LocalStorage 拿 Token
      const token = localStorage.getItem('token');

      // 2. 呼叫後端 DELETE API
      const res = await fetch(`${API_URL}/posts/${id}`, {
        method: 'DELETE',
        headers: {
            // 關鍵：把通行證夾在 Header 傳給後端
            'Authorization': `Bearer ${token}` 
        }
      });

      if (!res.ok) throw new Error('刪除失敗');

      // 3. 刪除成功，跳轉回首頁
      alert('刪除成功！');
      router.push('/');
      router.refresh(); // 強制刷新首頁列表
    } catch (error) {
      alert('發生錯誤');
      setIsDeleting(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium"
    >
      {isDeleting ? '刪除中...' : '刪除文章'}
    </button>
  );
}