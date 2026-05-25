import { getSettings } from '@/lib/db';
import PhotoClient from '@/components/PhotoClient';

export async function generateMetadata() {
  const seo = await getSettings();
  return {
    title: `Photo | ${seo?.siteName || 'Portfolio'}`,
    description: 'Photography by ' + (seo?.siteName || ''),
  };
}

export default async function PhotoPage() {
  const seo = await getSettings();
  return <PhotoClient seo={seo} photos={seo?.photos || []} />;
}
