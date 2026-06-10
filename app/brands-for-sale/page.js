import { getProjects, getSettings } from '@/lib/db';
import ListingClient from '@/components/ListingClient';
export async function generateMetadata() {
  const seo = await getSettings();
  const title = `${seo?.brandsTitle || 'Brands for Sale'} | ${seo?.siteName || 'Portfolio'}`;
  const description = seo?.brandsIntro || 'Ready-made brand identities and domains for sale — name, logo, and visual system.';
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', images: seo?.ogImage ? [seo.ogImage] : [] },
    twitter: { card: 'summary_large_image', title, description },
  };
}
export default async function BrandsForSalePage() {
  const [projects, seo] = await Promise.all([getProjects(), getSettings()]);
  const items = projects.filter((p) => p.type === 'brand-for-sale' && p.ready);
  return (
    <ListingClient
      projects={items}
      seo={seo}
      title={seo?.brandsTitle || 'Brands for Sale'}
      intro={seo?.brandsIntro || "Ready-made brand identities looking for an owner. Each one comes fully built — name, logo, visual system — so you can launch fast instead of starting from zero. Browse what's available and make it yours."}
    />
  );
}
