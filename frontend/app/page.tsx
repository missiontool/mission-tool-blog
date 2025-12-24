import Link from 'next/link';
import { API_URL } from './config';

// 1. 定義資料長相 (TypeScript 介面)
// 這邊要對應妳 Go 語言 Struct 的 JSON Tag
interface Post {
  id: number;
  title: string;
  content: string;
  status: string;
  category: string;
  created_at: string;
}

// 定義 API 回傳的整包格式 (因為我們後端包了一層 data)
interface ApiResponse {
  data: Post[];
  count: number;
}

// 2. 抓資料的函式 (Server Side Fetching)
// 這個函式會直接在伺服器端執行，不會暴露給瀏覽器，SEO 非常好
async function getPosts() {
  // 注意：這裡是去抓 Go 的 API (8080 Port)
  // 如果之後報錯，我們會把 localhost 改成 127.0.0.1
  const res = await fetch(`${API_URL}/posts`, {
    cache: 'no-store', // 關鍵：告訴 Next.js 不要快取，每次都抓最新的 (開發時方便)
  });

  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }

  return res.json();
}

// 3. 頁面主元件 (Home)
export default async function Home() {
  const response: ApiResponse = await getPosts();
  const posts = response.data;

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* 標題區塊 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">任務筆記 Mission Tool 🚀</h1>
            <span className="text-sm text-gray-500 mt-1 block">文章數量: {response.count}</span>
          </div>
          
          {/* 新增按鈕 */}
          <Link 
            href="/posts/create" 
            className="bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition shadow-sm flex items-center gap-2 font-medium"
          >
            <span className="text-xl leading-none">+</span>
            <span>新增文章</span>
          </Link>
        </div>
        
        <div className="grid gap-4">
          {posts.map((post) => (
            // 2. 這裡用 Link 包起來，點擊就會跳轉到 /posts/[id]
            <Link key={post.id} href={`/posts/${post.id}`} className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200">
                      {post.category || '未分類'} 
                    </span>
                    
                    {/* 原本的狀態標籤 */}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {post.status}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                    {post.title}
                  </h2>
                  
                <p className="text-gray-600 line-clamp-2 mb-4">{post.content}</p>
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>ID: {post.id}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}