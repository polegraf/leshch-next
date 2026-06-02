import { getProjects, getSettings } from '@/lib/db';
import HomeClient from '@/components/HomeClient';
export default async function HomePage() {
  const [projects, seo] = await Promise.all([getProjects(), getSettings()]);
  // Полный список уходит в HomeClient: главная сама показывает только Works,
  // а админка внутри получает все проекты (включая brand-for-sale / shop).
  return <HomeClient projects={projects} seo={seo} />;
}
