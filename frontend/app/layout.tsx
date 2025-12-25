import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO 設定
export const metadata: Metadata = {
  // 1. 網站標題設定
  title: {
    template: "%s | 任務筆記 Mission Tool", // %s 會被內頁標題取代 (例如 "我的第一篇 Go 文章 | 任務筆記...")
    default: "任務筆記 Mission Tool",       // 如果內頁沒設定，就顯示這個
  },
  // 2. 網站描述 (Google 搜尋結果下面的那行字)
  description: "一個基於 Go 與 Next.js 建構的高效能全端部落格，紀錄技術與生活。",

  // 3. Open Graph (給 FB, Line, Discord 看的卡片)
  openGraph: {
    title: "任務筆記 Mission Tool",
    description: "紀錄 Vue, C#, Go, Next.js 的全端開發旅程。",
    url: "https://mission-tool-blog.vercel.app", // 記得換成你的 Vercel 網址
    siteName: "Mission Tool",
    locale: "zh_TW",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
