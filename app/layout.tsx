import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter, Merriweather } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { RouteLoader } from '@/components/RouteLoader';

import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
} from '@/lib/site';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const merriweather = Merriweather({ subsets: ['latin'], variable: '--font-heading' });

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · UBC Okanagan`,
    template: `%s · ${SITE_SHORT_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'rinmeng', url: 'https://github.com/rinmeng' }],
  creator: 'rinmeng',
  category: 'education',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: 'en_CA',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#141110' },
  ],
};

/**
 * Runs before first paint: the first time someone visits, mark this browser session so
 * numbers count up (components/CountUp.tsx); returning visitors just see the numbers.
 */
const firstVisitScript = `try{var l=localStorage,s=sessionStorage;if(!l.getItem('cosc499-seen')){l.setItem('cosc499-seen','1');s.setItem('cosc499-countup','1')}if(s.getItem('cosc499-countup'))document.documentElement.dataset.countup='1'}catch(e){}`;

/** Structured data so search engines know what the site is about. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: ['UBCO COSC499 Stats', 'COSC 499 Capstone Stats'],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'en-CA',
  about: {
    '@type': 'Course',
    name: 'COSC 499: Capstone Software Engineering Project',
    courseCode: 'COSC 499',
    provider: {
      '@type': 'CollegeOrUniversity',
      name: 'University of British Columbia Okanagan',
      alternateName: 'UBCO',
    },
  },
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: firstVisitScript }} />
      </head>
      <body className='antialiased'>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <TooltipProvider>
            <RouteLoader />
            <Navbar />
            <main className='mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8'>
              {children}
            </main>
            <Footer />
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
