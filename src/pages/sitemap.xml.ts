import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const formatDate = (date: Date) => date.toISOString();

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL not configured', { status: 500 });
  }

  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const latestPostDate = sortedPosts[0]?.data.pubDate;

  const urls = [
    { loc: new URL('/', site).href, lastmod: latestPostDate },
    ...sortedPosts.map((post) => ({
      loc: new URL(`/blog/${post.slug}/`, site).href,
      lastmod: post.data.pubDate
    }))
  ];

  const body = urls
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `<lastmod>${formatDate(lastmod)}</lastmod>` : '';
      return `  <url><loc>${loc}</loc>${lastmodTag}</url>`;
    })
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
