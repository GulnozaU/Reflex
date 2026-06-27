import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
});

const siteUrl = 'https://reflex.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Reflex — Your AI coding agent learns what works',
  description:
    'Reflex captures successful workflows, fixes, and repeated patterns from real coding sessions — then reuses them when similar situations appear.',
  keywords: [
    'Reflex',
    'AI coding',
    'Cursor',
    'VS Code',
    'developer tools',
    'local-first',
    'workflow memory'
  ],
  authors: [{ name: 'Reflex' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Reflex',
    title: 'Reflex — Your AI coding agent learns what works',
    description:
      'Local-first developer infrastructure. Capture workflows, detect patterns, save fixes, replay when needed.',
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Reflex' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reflex — Your AI coding agent learns what works',
    description: 'Developer infrastructure for coding agent memory. Cursor and VS Code.',
    images: ['/og.svg']
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
