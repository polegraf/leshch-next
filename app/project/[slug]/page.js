import { getProjects, getSettings, toSlug } from '@/lib/db';
import ProjectClient from '@/components/ProjectClient';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects
    .filter((p) => p.ready)
    .map((p) => ({ slug: toSlug(p.title) }));
}

export async function generateMetadata({ params }) {
  const projects = await getProjects();
  const seo = await getSettings();
  const project = projects.find((p) => toSlug(p.title) === params.slug);

  if (!project) return {};

  const title = `${project.title} — ${project.subtitle} | ${seo?.siteName || 'Portfolio'}`;
  const description = project.desc || seo?.metaDesc || '';
  const image = project.cover || seo?.ogImage || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, width: 1200, height: 630, alt: project.title }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProjectPage({ params }) {
  const projects = await getProjects();
  const seo = await getSettings();
  const project = projects.find((p) => toSlug(p.title) === params.slug);

  if (!project || !project.ready) notFound();

  return <ProjectClient project={project} seo={seo} />;
}
