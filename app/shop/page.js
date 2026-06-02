import { getProjects, getSettings } from '@/lib/db';
import ListingClient from '@/components/ListingClient';

export async function generateMetadata() {
  const seo = await getSettings();
  const title = `Shop | ${seo?.siteName || 'Portfolio'}`;
  const description = 'Merch and goods.';
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images: seo?.ogImage ? [seo.ogImage] : [] },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ShopPage() {
  const [projects, seo] = await Promise.all([getProjects(), getSettings()]);
  const items = projects.filter((p) => p.type === 'shop' && p.ready);
  return (
    <ListingClient
      projects={items}
      seo={seo}
      title="Shop"
      subtitle="Merch & goods"
    />
  );
}
