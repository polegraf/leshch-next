import { getProjects, getSettings } from '@/lib/db';
import HomeClient from '@/components/HomeClient';

export default async function HomePage() {
  const [projects, seo] = await Promise.all([getProjects(), getSettings()]);
  return <HomeClient projects={projects} seo={seo} />;
}
