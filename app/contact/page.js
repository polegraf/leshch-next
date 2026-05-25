import { getSettings } from '@/lib/db';
import ContactClient from '@/components/ContactClient';

export async function generateMetadata() {
  const seo = await getSettings();
  return {
    title: `Contact | ${seo?.siteName || 'Portfolio'}`,
    description: `Get in touch with ${seo?.siteName || 'us'}.`,
  };
}

export default async function ContactPage() {
  const seo = await getSettings();
  return <ContactClient seo={seo} />;
}
