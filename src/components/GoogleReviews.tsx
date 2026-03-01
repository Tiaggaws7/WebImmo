import React, { useState, useEffect, useCallback } from "react";
import reviewsData from "../data/reviews.json";

// --- Types ---
interface Review {
  author: string;
  rating: number;
  date: string;
  visitDate: string;
  text: string;
  ownerResponse: string | null;
}

interface ReviewsData {
  statistics: {
    averageRating: number;
    totalReviews: number;
  };
  reviews: Review[];
}

// --- Component ---
const GoogleReviews: React.FC = () => {
  const data = reviewsData as ReviewsData;
  const { statistics, reviews } = data;

  // Only show reviews that have text, sorted by card size (shortest first)
  // Card size = text length + owner response length (no response = smallest)
  const reviewsWithText = reviews
    .filter((r) => r.text.trim() !== "")
    .sort((a, b) => {
      const sizeA = a.text.length + (a.ownerResponse?.length || 0);
      const sizeB = b.text.length + (b.ownerResponse?.length || 0);
      return sizeA - sizeB;
    });

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 400);
    },
    [isTransitioning]
  );

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % reviewsWithText.length);
  }, [currentIndex, reviewsWithText.length, goTo]);

  const goPrev = useCallback(() => {
    goTo(
      (currentIndex - 1 + reviewsWithText.length) % reviewsWithText.length
    );
  }, [currentIndex, reviewsWithText.length, goTo]);

  // Auto-play carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goNext, 6000);
    return () => clearInterval(timer);
  }, [goNext, isPaused]);

  const renderStars = (rating: number, size: string = "text-lg") => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span
          key={`star-${i}`}
          className={`${size} ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const currentReview = reviewsWithText[currentIndex];

  // Structured data for SEO
  const jsonLdScript = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Elise BUIL Immobilier",
    url: "https://elisebuilimmobilierguadeloupe.com/",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: statistics.averageRating.toFixed(1),
      reviewCount: statistics.totalReviews,
    },
    review: reviewsWithText.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.author },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: "5",
      },
      reviewBody: review.text,
    })),
  };

  return (
    <div
      className="font-[Inter] w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            .review-card { transition: opacity 0.4s ease, transform 0.4s ease; }
            .review-dot { transition: all 0.3s ease; }
          `,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdScript) }}
      />

      {/* Compact stats header */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <img
          src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
          alt="Google"
          className="h-5"
        />
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-xl text-gray-800">
            {statistics.averageRating.toFixed(1)}
          </span>
          <div className="flex items-center">{renderStars(statistics.averageRating, "text-base")}</div>
        </div>
        <a
          href="https://maps.app.goo.gl/UrPCLApF122Ab6Ng6"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          ({statistics.totalReviews} avis)
        </a>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Review card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 min-h-[180px] flex flex-col">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentReview.author.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">
                {currentReview.author}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex">{renderStars(currentReview.rating, "text-sm")}</div>
                <span className="text-xs text-gray-400">{currentReview.date}</span>
              </div>
            </div>
          </div>

          {/* Review text */}
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line flex-1 line-clamp-4">
            {currentReview.text}
          </p>

          {/* Owner response (compact) */}
          {currentReview.ownerResponse && (
            <div className="mt-3 pl-3 border-l-2 border-blue-300 bg-blue-50/60 py-2 px-3 rounded-r-lg">
              <p className="text-xs text-blue-700 font-medium mb-0.5">
                Réponse du propriétaire
              </p>
              <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line line-clamp-2">
                {currentReview.ownerResponse}
              </p>
            </div>
          )}

          {/* "Read more" link */}
          <a
            href="https://maps.app.goo.gl/UrPCLApF122Ab6Ng6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 mt-3 text-right hover:underline block"
          >
            Lire la suite sur Google →
          </a>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all z-10"
          aria-label="Avis précédent"
        >
          ‹
        </button>
        <button
          onClick={goNext}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all z-10"
          aria-label="Avis suivant"
        >
          ›
        </button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {reviewsWithText.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`review-dot rounded-full ${index === currentIndex
              ? "w-5 h-2 bg-blue-500"
              : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
              }`}
            aria-label={`Avis ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default GoogleReviews;
