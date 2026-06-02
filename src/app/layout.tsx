import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ינון מגל ובן כספית | 103FM',
  description: 'האזנה לתוכניות של ינון מגל ובן כספית ב-103FM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
