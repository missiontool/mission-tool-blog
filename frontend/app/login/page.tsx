'use client'; // 這是客戶端元件 (因為有輸入框、按鈕)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../config';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 防止表單重新整理
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '登入失敗');
      }

      // 🔥 關鍵步驟：把 Token 存到瀏覽器的 LocalStorage
      // 這樣重新整理網頁，瀏覽器還會記得你有登入
      localStorage.setItem('token', data.token);

      alert('登入成功！歡迎回來 🚀');
      router.push('/'); // 跳轉回首頁
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">管理員登入</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="請輸入帳號"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
              placeholder="請輸入密碼"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}