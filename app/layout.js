import { getSettings } from '@/lib/db';

export async function generateMetadata() {
  const seo = await getSettings();
  return {
    title: seo?.metaTitle || 'Portfolio — Designer & Art Director',
    description: seo?.metaDesc || 'Designer and art director. Visual systems, brand identities, editorial content.',
    openGraph: {
      title: seo?.metaTitle || 'Portfolio — Designer & Art Director',
      description: seo?.metaDesc || '',
      images: seo?.ogImage ? [{ url: seo.ogImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.metaTitle || '',
      description: seo?.metaDesc || '',
      images: seo?.ogImage ? [seo.ogImage] : [],
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, background: '#000', color: '#fff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
