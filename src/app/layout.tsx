import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MyN64List',
  description: 'The ultimate Nintendo 64 game database and tracking community.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The ThemeToggle component sets data-theme on html via useEffect to match user preferences.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 56px - 140px)', padding: '2rem 0' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
