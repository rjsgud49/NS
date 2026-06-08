import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NS — NestJS Server Generator',
  description: 'GUI 기반 NestJS 서버 자동 생성기',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
