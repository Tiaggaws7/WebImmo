import React, { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";

// --- Types ---
interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number; // Unix timestamp (seconds)
}

// --- Component ---
const GoogleReview: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [businessName, setBusinessName] = useState<string>("");
  const [businessType, setBusinessType] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const docRef = doc(db, "google_reviews", "summary");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setReviews((data.reviews as Review[]) || []);
          setAverageRating((data.averageRating as number) || 0);
          setReviewCount((data.reviewCount as number) || 0);
          setBusinessName((data.businessName as string) || "");
          setBusinessType((data.businessType as string[]) || []);
        } else {
          console.log("No review summary document found!");
          setError("Les avis ne sont pas disponibles pour le moment.");
        }
      } catch (err) {
        console.error("Error fetching reviews from Firestore:", err);
        setError("Impossible de charger les avis.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`star-full-${i}`} className="text-yellow-400 text-xl">
          ★
        </span>
      );
    }

    for (let i = stars.length; i < 5; i++) {
      stars.push(
        <span key={`star-empty-${i}`} className="text-gray-300 text-xl">
          ★
        </span>
      );
    }

    return stars;
  };

  const translateBusinessType = (type: string): string => {
    const translations: Record<string, string> = {
      'real_estate_agency': 'Agent immobilier',
      'point_of_interest': 'Point d\'intérêt',
      'establishment': 'Établissement',
    };
    return translations[type] || type;
  };

  // Structured data for SEO
  const jsonLdScript = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Elise BUIL Immobilier",
    url: "https://elisebuilimmobilierguadeloupe.com/",
    telephone: "YOUR_PHONE_NUMBER",
    address: {
      "@type": "PostalAddress",
      streetAddress: "YOUR_STREET_ADDRESS",
      addressLocality: "YOUR_CITY",
      postalCode: "YOUR_POSTAL_CODE",
      addressCountry: "GP",
    },
    image: "URL_TO_YOUR_LOGO",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviewCount,
    },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.author_name },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: "5",
      },
      datePublished: new Date(review.time * 1000)
        .toISOString()
        .split("T")[0],
      reviewBody: review.text,
    })),
  };

  if (isLoading) {
    return (
      <div className="text-center font-[Inter] p-4">Chargement des avis...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center font-[Inter] p-4 text-red-500">{error}</div>
    );
  }

  return (
    <div className="text-center font-[Inter] bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
      `,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdScript) }}
      />
      <img
        src="https://lh3.googleusercontent.com/a/ACg8ocK_g-14R4OT8g_SAo-o3uk5V_T2a9V5pYJ_7a-S2zY=s128-c0x00000000-cc-rp-mo-ba4"
        alt="Google Reviews"
        className="h-12 w-12 mx-auto mb-3"
      />
      <h3 className="text-xl font-bold text-gray-800 mb-1">
        {businessName || "Avis de nos clients"}
      </h3>
      {businessType.length > 0 && (
        <p className="text-sm text-gray-600 mb-2">
          {translateBusinessType(businessType[0])}
        </p>
      )}
      <div className="text-gray-600 mb-2">
        <span className="font-semibold text-lg">
          {averageRating.toFixed(1)}
        </span>
        {" sur 5"}
      </div>
      <div className="inline-flex items-center justify-center space-x-1 leading-none mb-4">
        {renderStars(averageRating)}
      </div>
      <a
        href="https://maps.app.goo.gl/aDU4gSfJta9741hV7"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline"
      >
        Basé sur {reviewCount} avis Google
      </a>
    </div>
  );
};

export default GoogleReview;
