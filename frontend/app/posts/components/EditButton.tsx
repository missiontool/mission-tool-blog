'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EditButton({ id }: { id: number }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 檢查有沒有通行證
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  // 沒登入就隱藏
  if (!isLoggedIn) return null;

  return (
    <Link 
      href={`/posts/${id}/edit`}
      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
    >
      編輯文章
    </Link>
  );
}