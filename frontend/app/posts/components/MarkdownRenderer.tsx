'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    // prose 是 Tailwind Typography 提供的魔法樣式
    // prose-lg: 字體大一點
    // prose-blue: 連結變藍色
    // max-w-none: 讓文章寬度不要被限制住
    <article className="prose prose-lg prose-blue max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}