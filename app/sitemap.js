import { getProjects, toSlug } from '@/lib/db';

export default async function sitemap() {
  const projects = await getProjects();
  const baseUrl = 'https://leshch.com';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/photo`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ];

  const projectPages = projects
    .filter((p) => p.ready)
    .map((p) => ({
      url: `${baseUrl}/project/${toSlug(p.title)}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

  return [...staticPages, ...projectPages];
}
