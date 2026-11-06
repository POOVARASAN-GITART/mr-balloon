import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ToasterWrapper } from '@/components/ui/Toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Mr Balloon - Premium Event Decoration & Balloon Decor',
    template: '%s | Mr Balloon',
  },
  description: 'Custom balloon decor and stage styling for Birthdays, Marriages, and Special Events. Premium designs, transparent pricing, and seamless booking.',
  keywords: ['balloon decoration', 'event decor', 'birthday decoration', 'wedding decor', 'stage backdrop', 'balloon arch'],
  authors: [{ name: 'Mr Balloon' }],
  creator: 'Mr Balloon',
  publisher: 'Mr Balloon',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://mrballoon.in',
    siteName: 'Mr Balloon',
    title: 'Mr Balloon - Premium Event Decoration',
    description: 'Custom balloon decor and stage styling for Birthdays, Marriages, and Special Events.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Mr Balloon - Premium Event Decoration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mr Balloon - Premium Event Decoration',
    description: 'Custom balloon decor and stage styling for Birthdays, Marriages, and Special Events.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <ToasterWrapper>
          {children}
        </ToasterWrapper>
      </body>
    </html>
  );
}