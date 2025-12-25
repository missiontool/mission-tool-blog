'use client'; // 👈 關鍵：只有客戶端元件能讀 LocalStorage

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AddButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 檢查瀏覽器有沒有存 Token
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // 如果沒登入，就回傳 null (什麼都不渲染，按鈕直接消失)
  if (!isLoggedIn) {
    return null;
  }

  // 有登入才顯示按鈕
  return (
    <Link 
      href="/posts/create" 
      className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition shadow-sm flex items-center gap-2 font-medium"
    >
      <span className="text-xl leading-none">+</span>
      <span>新增文章</span>
    </Link>
  );
}