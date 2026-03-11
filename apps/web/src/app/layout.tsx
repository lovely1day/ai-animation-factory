import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: 'AI Animation Factory - Create AI-Powered Animated Content',
  description: 'Transform your ideas into stunning animated episodes with our AI-powered platform. Professional quality, unlimited creativity.',
  keywords: ['AI', 'animation', 'video', 'content creation', 'SaaS'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang=\"en\" suppressHydrationWarning className=\"dark\">
      <body className={${inter.variable}  font-sans}>
        {children}
      </body>
    </html>
  );
}
