import Link from 'next/link';
import DeleteButton from '@/app/posts/components/DeleteButton';
import MarkdownRenderer from '@/app/posts/components/MarkdownRenderer';
import { API_URL } from '../../config';

// 1. 定義資料結構
interface Post {
  id: number;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

// 2. 抓取單篇文章的函式
async function getPost(id: string) {
  // 這裡的 id 終於會是 "1" 而不是 "undefined" 了
  const res = await fetch(`${API_URL}/posts/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch post');
  }

  const json = await res.json();
  return json.data;
}

// 3. 頁面元件
// 🔥 關鍵修正：注意 params 的型別變成了 Promise
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  
  // 🔥 關鍵修正：必須先 await params 才能拿到 id
  const { id } = await params;
  
  const post: Post = await getPost(id);

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex justify-center">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        
        {/* 返回按鈕 */}
        <Link href="/" className="text-blue-500 hover:underline mb-6 inline-block">
          ← 回到列表
        </Link>

        {/* 文章標頭 */}
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              {post.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            發布時間：{new Date(post.created_at).toLocaleString()}
          </p>
        </div>

        {/* 文章內容 */}
        {/* <article className="prose lg:prose-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </article> */}

        <div className="mb-10">
            <MarkdownRenderer content={post.content} />
        </div>

        <div className="border-t pt-6 flex justify-end gap-4">
           {/* 編輯按鈕 */}
           <Link 
             href={`/posts/${post.id}/edit`}
             className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
           >
             編輯文章
           </Link>

           <DeleteButton id={post.id} />
        </div>

      </div>
    </main>
  );
}