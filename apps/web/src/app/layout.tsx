import type { Metadata, Viewport } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/language-context';
import AppHeader from '@/components/layout/header';
import AppFooter from '@/components/layout/footer';
import { FloatingLogoBackground } from '@/components/layout/FloatingLogoBackground';
import JLAssistant from '@/components/JLAssistant';
import { StatusBanner } from '@/components/layout/StatusBanner';
import { Analytics } from '@/components/analytics';
import { BackButton } from '@/components/ui/back-button';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-animation-factory-web.vercel.app';
const SITE_NAME_EN = 'AI Animation Factory';
const SITE_NAME_AR = 'مصنع الأنيميشن بالذكاء الاصطناعي';
const SITE_DESC_EN = 'Turn your ideas into stunning cinematic videos in minutes — from idea to finished animated episode, powered by AI.';
const SITE_DESC_AR = 'حوّل أفكارك إلى مسلسلات أنيميشن سينمائية خلال دقائق — من الفكرة إلى الحلقة المكتملة، بالذكاء الاصطناعي.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME_EN} · ${SITE_NAME_AR}`,
    template: `%s · ${SITE_NAME_EN}`,
  },
  description: SITE_DESC_EN,
  keywords: [
    'AI animation', 'animation factory', 'JackoLeeno', 'JL', 'video generation',
    'AI video', 'Arabic AI', 'مصنع أنيميشن', 'فيديو بالذكاء الاصطناعي', 'أنيميشن',
  ],
  authors: [{ name: 'JackoLeeno JL', url: 'https://jackoleeno.com' }],
  creator: 'JackoLeeno JL',
  publisher: 'JackoLeeno JL',
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      ar: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME_EN,
    title: `${SITE_NAME_EN} · ${SITE_NAME_AR}`,
    description: SITE_DESC_EN,
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    images: [{ url: '/images/jl-logo.png', width: 512, height: 512, alt: 'JackoLeeno JL' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME_EN} · ${SITE_NAME_AR}`,
    description: SITE_DESC_EN,
    images: ['/images/jl-logo.png'],
    creator: '@jackoleeno',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [{ url: '/images/jl-logo.png' }],
    apple: [{ url: '/images/jl-logo.png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#c9a84c',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME_EN,
  alternateName: SITE_NAME_AR,
  url: SITE_URL,
  description: SITE_DESC_EN,
  inLanguage: ['ar', 'en'],
  publisher: {
    '@type': 'Organization',
    name: 'JackoLeeno JL',
    url: 'https://jackoleeno.com',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <head suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="jl-surface antialiased font-sans flex flex-col min-h-screen relative">
        <LanguageProvider>
          <FloatingLogoBackground />
          <div className="relative z-10 flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 pt-16">
              <div className="px-4 pt-2 flex items-center justify-between gap-2">
                <BackButton />
                <StatusBanner project="factory" lang="ar" />
              </div>
              {children}
            </main>
            <AppFooter />
          </div>
          <JLAssistant project="factory" lang="ar" />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
