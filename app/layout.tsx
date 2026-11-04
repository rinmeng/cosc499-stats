import type { Metadata } from 'next';
import { Geist_Mono, Inter, Merriweather } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { Navbar } from '@/components/Navbar';

import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const merriweather = Merriweather({ subsets: ['latin'], variable: '--font-heading' });

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'COSC 499 Capstone Stats',
  description:
    'Contribution highlights and progress for every UBC Okanagan COSC 499 capstone cohort on GitHub.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn(
        'font-sans',
        inter.variable,
        merriweather.variable,
        geistMono.variable
      )}
    >
      <body className='antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <TooltipProvider>
            <Navbar />
            <main className='mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
              {children}
            </main>
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
