import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

// --- Helpers & Subcomponents ---
const renderStars = (rating: number, size: string = "text-lg", activeColor: string = "text-yellow-400") => {
  const stars = [];
  for (let i = 0; i < 5; i++) {
    stars.push(
      <span
        key={`star-${i}`}
        className={`${size} leading-none ${i < rating ? activeColor : "text-gray-200"}`}
      >
         ★
      </span>
    );
  }
  return stars;
};

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const [showResponse, setShowResponse] = useState(false);

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col h-full relative">
      <div className="flex items-center gap-1 mb-5">
          {renderStars(review.rating, "text-xl", "text-yellow-400")}
      </div>
      
      <div className="flex-grow flex flex-col mb-8">
        <p className={`text-gray-700 italic leading-relaxed transition-all duration-300 ${showResponse ? '' : 'line-clamp-4'}`}>
          "{review.text}"
        </p>
        
        {review.ownerResponse && !showResponse && (
          <button 
            onClick={() => setShowResponse(true)}
            className="mt-4 text-left text-[13px] text-gray-500 font-semibold hover:text-primary transition-colors inline-block w-max"
          >
            Voir la réponse
          </button>
        )}

        {review.ownerResponse && showResponse && (
          <div className="mt-5 border-l-[3px] border-primary/40 bg-red-50/50 py-3 px-4 rounded-r-xl relative animate-in fade-in duration-300">
            <button 
              onClick={() => setShowResponse(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-[10px] uppercase font-bold transition-colors"
            >
              Fermer
            </button>
            <p className="text-[10px] text-primary font-extrabold mb-1.5 uppercase tracking-widest pr-12">
              Réponse d'Elise BUIL
            </p>
            <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">
              {review.ownerResponse}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-50">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
          {review.author?.charAt(0).toUpperCase() || "A"}
        </div>
        <div>
          <p className="font-bold text-gray-900 leading-tight text-sm">
            {review.author}
          </p>
          <span className="text-xs text-gray-400">{review.date}</span>
        </div>
      </div>
      
      <div className="absolute top-8 right-8 text-gray-200 pointer-events-none">
        <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-3 opacity-30 grayscale" />
      </div>
    </div>
  );
};

// --- GoogleReviews Main Component ---
const GoogleReviews: React.FC = () => {
  const data = reviewsData as ReviewsData;
  const { statistics, reviews } = data;

  const reviewsWithText = reviews.filter((r) => r.text.trim() !== "");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const updateSize = () => {
      setItemsPerView(window.innerWidth < 768 ? 1 : 3);
    };
    updateSize(); // Initialize on mount
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const maxIndex = Math.max(0, reviewsWithText.length - itemsPerView);

  // Auto-play carousel
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [maxIndex, isPaused]);

  const goNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <div 
      className="w-full relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Avis Google</h2>
          <p className="text-gray-500 text-lg">
            La satisfaction de mes clients est ma priorité au quotidien.
          </p>
        </div>
        <div className="flex flex-col items-end">
           <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-700">
               <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-4 object-contain" />
               <span>{statistics.averageRating.toFixed(1)}/5</span>
             </div>
             <div className="flex items-center mt-[-2px]">{renderStars(statistics.averageRating, "text-xl", "text-yellow-400")}</div>
           </div>
        </div>
      </div>

      <div className="relative">
        <button 
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 sm:-ml-12 lg:-ml-16 z-20 bg-white p-3 md:p-4 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 hover:scale-105 transition-all hidden sm:flex items-center justify-center text-gray-600 hover:text-primary focus:outline-none"
          aria-label="Avis précédent"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button 
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 sm:-mr-12 lg:-mr-16 z-20 bg-white p-3 md:p-4 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 hover:scale-105 transition-all hidden sm:flex items-center justify-center text-gray-600 hover:text-primary focus:outline-none"
          aria-label="Avis suivant"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="overflow-hidden py-8 -my-8 px-2 -mx-2">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` 
            }}
          >
            {reviewsWithText.map((review, idx) => (
               <div 
                 key={idx} 
                 className="w-full md:w-1/3 flex-shrink-0 px-4"
               >
                 <ReviewCard review={review} />
               </div>
            ))}
          </div>
        </div>
        
        {/* Navigation Dots for Mobile */}
        <div className="flex justify-center gap-1.5 mt-8 md:hidden">
          {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentIndex(dotIdx)}
              className={`rounded-full transition-all duration-300 ${dotIdx === currentIndex ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-gray-300"}`}
              aria-label={`Aller à l'avis ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoogleReviews;;
