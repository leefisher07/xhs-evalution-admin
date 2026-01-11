import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XHS 心理测评管理后台',
  description: '验证码管理系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
