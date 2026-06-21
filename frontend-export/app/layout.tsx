import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { DM_Sans, Playfair_Display } from 'next/font/google';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-dm-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'], style: ['normal', 'italic'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'ATBU | Ethical AI Literacy System',
  description: 'An interactive learning platform teaching university students to use AI tools ethically, critically, and responsibly.',
  keywords: ['AI ethics', 'ethical AI', 'university', 'ATBU', 'AI literacy', 'education'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.setAttribute('data-theme', 'light');
              }
            } catch(e) {}
          })();
        ` }} />
      </head>
      <body className="min-h-screen font-sans flex flex-col" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)' }} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-grow flex flex-col relative">
                {children}
              </main>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
