import { getProjects, getSettings } from '@/lib/db';
import HomeClient from '@/components/HomeClient';
export default async function HomePage() {
  const [projects, seo] = await Promise.all([getProjects(), getSettings()]);
  const works = projects.filter((p) => !p.type || p.type === 'work');
  return <HomeClient projects={works} seo={seo} />;
}
