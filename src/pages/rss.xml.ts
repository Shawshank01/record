import rss from '@astrojs/rss';
import { getCollection, render } from 'astro:content';
import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import sanitizeHtml from 'sanitize-html';

export const GET: APIRoute = async (context) => {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  const sortedBlog = blog.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const renderers = await loadRenderers([]);
  const container = await AstroContainer.create({ renderers });

  const items = await Promise.all(
    sortedBlog.map(async (post) => {
      const { Content } = await render(post);
      const rawHtml = await container.renderToString(Content);
      const content = sanitizeHtml(rawHtml, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      });

      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
        content,
      };
    })
  );

  return rss({
    title: "Michifumi's Blog",
    description: "Dispatches from Michifumi's command chair.",
    site: context.site!,
    items,
  });
};
