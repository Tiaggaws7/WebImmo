import React, { useState } from 'react';

// Article interface (typically this would be in a separate file, but including here for completeness)
export interface Article {
  id: number;
  title: string;
  category: 'buyer' | 'seller' | 'investor' | 'general';
  excerpt: string;
  content: string;
}

// ArticleCard component
interface ArticleCardProps {
  article: Article;
  onSelect: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSelect }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
        <p className="text-gray-600 mb-4">{article.excerpt}</p>
        <button
          onClick={onSelect}
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Read More
        </button>
      </div>
    </div>
  );
};

// ArticleList component
interface ArticleListProps {
  articles: Article[];
  onArticleSelect: (article: Article) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({ articles, onArticleSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onSelect={() => onArticleSelect(article)}
        />
      ))}
    </div>
  );
};

// FullArticle component
interface FullArticleProps {
  article: Article;
  onBack: () => void;
}

const FullArticle: React.FC<FullArticleProps> = ({ article, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-600 mb-8">{article.excerpt}</p>
      <div className="prose max-w-none mb-8">
        {article.content}
      </div>
      <button
        onClick={onBack}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Back to All Articles
      </button>
    </div>
  );
};

// CategorySelector component
interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategory, onCategoryChange }) => {
  const categories = ['general', 'buyer', 'seller', 'investor'];

  return (
    <div className="flex space-x-4">
      {categories.map((category) => (
        <button
          key={category}
          className={`px-4 py-2 rounded ${
            selectedCategory === category
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
};

// Main BlogPage component
interface BlogPageProps {
  articles: Article[];
}

const Blog: React.FC<BlogPageProps> = ({ articles }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const filteredArticles = selectedCategory === 'general'
    ? articles
    : articles.filter(article => article.category === selectedCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedArticle(null);
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Real Estate Blog</h1>
      <div className="mb-6">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>
      {selectedArticle ? (
        <FullArticle
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      ) : (
        <ArticleList
          articles={filteredArticles}
          onArticleSelect={handleArticleSelect}
        />
      )}
    </div>
  );
};

export default Blog;