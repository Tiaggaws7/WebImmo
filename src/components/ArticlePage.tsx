import { useLoaderData, LoaderFunctionArgs } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { createClient } from 'contentful';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import { Article } from '../types';

const contentfulClient = createClient({
  space: import.meta.env.VITE_CONTENTFUL_SPACE_ID,
  accessToken: import.meta.env.VITE_CONTENTFUL_ACCESS_TOKEN,
});

// Loader function to fetch a single article
export async function loader({ params }: LoaderFunctionArgs): Promise<Article | null> {
    const { articleId } = params; // Extract articleId from params
    if (!articleId) return null; // Handle case where articleId is not available
    
    try {
      const response = await contentfulClient.getEntry(articleId);
      return {
        id: response.sys.id,
        title: typeof response.fields.title === 'string' ? response.fields.title : '',
        category: typeof response.fields.category === 'string' ? response.fields.category : '',
        excerpt: typeof response.fields.excerpt === 'string' ? response.fields.excerpt : '',
        content: response.fields.content, // Assuming content is correctly typed
        author: typeof response.fields.author === 'string' ? response.fields.author : '',
        date: typeof response.fields.date === 'string' ? response.fields.date : '',
      };
    } catch (error) {
      console.error('Error fetching article:', error);
      return null;
    }
  }

export default function ArticlePage() {
  // Explicitly define the article type
  const article = useLoaderData() as Article | null;

  if (!article) {
    return <p className="text-center text-gray-600">Article introuvable.</p>;
  }

  return (
    <div className="bg-white">
      <Helmet>
        <title>{article.title}</title>
        <meta name="description" content={article.excerpt} />
      </Helmet>
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-serif font-bold mb-4 text-gray-800">{article.title}</h1>
        <div className="text-sm text-gray-500 mb-6">
          <span>Par {article.author}</span>
          <span className="mx-2">|</span>
          <span>{article.date}</span>
        </div>
        <p className="text-xl text-gray-600 mb-8">{article.excerpt}</p>
        <div className="prose max-w-none mb-8">
          {documentToReactComponents(article.content, {
            renderNode: {
              [BLOCKS.PARAGRAPH]: (_node, children) => <p className="mb-4">{children}</p>,
              [BLOCKS.HEADING_1]: (_node, children) => (
                <h1 className="text-3xl font-bold mb-4">{children}</h1>
              ),
              [BLOCKS.HEADING_2]: (_node, children) => (
                <h2 className="text-2xl font-semibold mb-3">{children}</h2>
              ),
            },
            renderMark: {
              [MARKS.BOLD]: (text) => <strong className="font-bold">{text}</strong>,
            },
          })}
        </div>

        {/* Structured Data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": article.title,
            "datePublished": article.date,
            "author": {
              "@type": "Person",
              "name": article.author,
            },
          })}
        </script>
      </article>
    </div>
  );
}
