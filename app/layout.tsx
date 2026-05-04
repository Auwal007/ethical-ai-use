import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ATBU | Ethical AI Literacy',
  description: 'Learn to use AI tools ethically and critically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

