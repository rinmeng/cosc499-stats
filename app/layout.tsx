import type { Metadata } from 'next';
import { Geist_Mono, Inter, Merriweather } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { Navbar } from '@/components/Navbar';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const merriweather = Merriweather({
  variable: '--font-heading',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Next.js Starter - Shadcn + Supabase',
  description: 'A modern Next.js boilerplate with Shadcn UI and Supabase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn(
        'font-sans',
        inter.variable,
        merriweather.variable,
        geistMono.variable
      )}
    >
      <body className='antialiased'>
        <AuthProvider>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <ToastProvider>
              <Navbar />
              <main>{children}</main>
              <Toaster />
              <Analytics />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
