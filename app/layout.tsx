export const runtime = 'edge';
import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import siteContent from '@/content/site.json';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: siteContent.meta.siteName + ' | Esports & Community',
  description: siteContent.meta.description,
  manifest: '/site.webmanifest',
  openGraph: {
    title: siteContent.meta.siteName,
    description: siteContent.meta.description,
    url: siteContent.meta.siteUrl,
    siteName: siteContent.hero.title,
    images: [{ url: siteContent.meta.ogImage, width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  metadataBase: new URL(siteContent.meta.siteUrl),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
