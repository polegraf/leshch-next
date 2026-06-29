export const dynamic = 'force-dynamic';

import { getProjects, getSettings } from '@/lib/db';
import AdminClient from '@/components/AdminClient';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const [projects, seo] = await Promise.all([getProjects(), getSettings()]);
  return <AdminClient projects={projects} seo={seo} />;
}
