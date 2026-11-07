import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter, Merriweather } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { ScrollToTop } from '@/components/ScrollToTop';

import './globals.css';

import { BannerProvider, BannerSpacer } from '@/components/banner-provider';
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
    default: SITE_NAME,
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
  // Google Search Console HTML-tag verification (optional; DNS verification works too)
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
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

/** Structured data so search engines know what the site is about. */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: [
    'UBCO COSC499 Stats',
    'COSC 499 Capstone Stats',
    'UBCO Capstone Stats',
    'UBC Okanagan Capstone Stats',
  ],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: 'en-CA',
  about: {
    '@type': 'Course',
    name: 'COSC 499: Capstone Software Engineering Project',
    alternateName: ['COSC_O 499', 'COSC499', 'UBCO capstone', 'UBC Okanagan capstone'],
    courseCode: 'COSC 499',
    description:
      'The UBC Okanagan computer science capstone: student teams build a software project for a client over a full term or summer session.',
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
      <body className='antialiased'>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <TooltipProvider>
            <BannerProvider>
              <ScrollToTop />
              <Navbar />
              <main className='page-container pt-26 pb-16'>
                <BannerSpacer />
                {children}
              </main>
              <Footer />
              <Analytics />
            </BannerProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
