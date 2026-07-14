import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { PRODUCT_DEFINITION } from '@/lib/product';
import { SITE_URL } from '@/lib/github';
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

const title = 'Reflex — local workflow memory for coding agents';
const description = PRODUCT_DEFINITION + ' Captures file and terminal traces locally, detects repeated debugging loops, and surfaces saved fix summaries.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  keywords: [
    'Reflex',
    'workflow memory',
    'local-first',
    'Cursor',
    'VS Code',
    'Claude Code',
    'Codex',
    'developer tools'
  ],
  authors: [{ name: 'Reflex' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Reflex',
    title,
    description,
    images: [{ url: '/og.svg', width: 1200, height: 630, alt: 'Reflex' }]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
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
