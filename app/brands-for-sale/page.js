import { getProjects, getSettings } from '@/lib/db';
import ListingClient from '@/components/ListingClient';

const DEFAULT_TITLE = 'Brands for Sale';
const DEFAULT_INTRO = 'Ready-made brand identities looking for an owner. Each one comes fully built — name, logo, visual system — so you can launch fast instead of starting from zero. Browse what is available and make it yours.';

export async function generateMetadata() {
  const seo = await getSettings();
  const title = `${seo?.brandsTitle || DEFAULT_TITLE} | ${seo?.siteName || 'Portfolio'}`;
  const description = seo?.brandsIntro || DEFAULT_INTRO;
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
      title={seo?.brandsTitle || DEFAULT_TITLE}
      intro={seo?.brandsIntro || DEFAULT_INTRO}
    />
  );
}
