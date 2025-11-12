import './globals.css';
import type { Metadata } from 'next';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Koukian Restaurant - Where Luxury Meets Taste | كوكيان - حيث تلتقي الفخامة بالمذاق',
  description: 'Experience culinary excellence at Koukian, a luxury restaurant offering exceptional dining experiences with refined elegance and exquisite flavors.',
  keywords: 'luxury restaurant, fine dining, koukian, gourmet food, elegant atmosphere, premium cuisine, arabic restaurant, middle eastern cuisine, fine dining restaurant, luxury dining, restaurant reservation, كوكيان, مطعم فاخر, مطعم راقي',
  authors: [{ name: 'Koukian Restaurant' }],
  openGraph: {
    title: 'Koukian Restaurant - Luxury Dining Experience',
    description: 'Experience culinary excellence in an atmosphere of refined elegance',
    url: 'https://koukian-restaurant.com',
    siteName: 'Koukian Restaurant',
    images: [
      {
        url: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Koukian Restaurant Interior',
      },
    ],
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Koukian Restaurant - Luxury Dining Experience',
    description: 'Experience culinary excellence in an atmosphere of refined elegance',
    images: ['https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://koukian-restaurant.com',
    languages: {
      'en-US': 'https://koukian-restaurant.com/en',
      'ar-SA': 'https://koukian-restaurant.com/ar',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <LanguageProvider>
          {children}
          <Toaster position="top-center" richColors />
        </LanguageProvider>
      </body>
    </html>
  );
}