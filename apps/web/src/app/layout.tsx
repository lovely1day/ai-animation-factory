import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/language-context';
import AppHeader from '@/components/layout/header';
import AppFooter from '@/components/layout/footer';
import { AnimatedBackground } from '@/components/animated-background';

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

export const metadata: Metadata = {
  title: 'AI Animation Factory',
  description: 'Turn your ideas into stunning cinematic videos in minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${inter.variable} ${cairo.variable}`}>
      <head suppressHydrationWarning />
      <body className="bg-[#0a0a0f] text-white antialiased font-sans flex flex-col min-h-screen">
        <LanguageProvider>
          <AnimatedBackground />
          <AppHeader />
          <main className="flex-1 pt-16">
            {children}
          </main>
          <AppFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
