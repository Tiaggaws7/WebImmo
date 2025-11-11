import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

// Récupérer les variables d'environnement directement
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID;

/**
 * A scheduled Cloud Function that runs every 24 hours to fetch Google reviews (v2 Syntax).
 */
export const fetchGoogleReviews = onSchedule("every 24 hours", async () => {
  logger.log("🔄 Starting scheduled Google Reviews fetch...");
  
  if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
    logger.error("❌ API Key or Place ID is not configured.", {
      hasApiKey: !!GOOGLE_API_KEY,
      hasPlaceId: !!GOOGLE_PLACE_ID,
    });
    return;
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=name,rating,reviews,user_ratings_total&key=${GOOGLE_API_KEY}&language=fr`;

  try {
    logger.log("📡 Fetching from Google Places API...");
    const response = await axios.get(url);
    
    logger.log("API Response received:", { status: response.data.status });

    if (response.data.status !== "OK") {
      logger.error("❌ Google API error:", {
        status: response.data.status,
        errorMessage: response.data.error_message,
      });
      return;
    }

    const placeData = response.data.result;

    if (!placeData) {
      logger.error("❌ No place data found for the given Place ID.", {
        placeId: GOOGLE_PLACE_ID,
      });
      return;
    }

    const reviews = placeData.reviews || [];
    const averageRating = placeData.rating || 0;
    const reviewCount = placeData.user_ratings_total || 0;

    logger.log("📊 Place data retrieved:", {
      name: placeData.name,
      reviewCount,
      averageRating,
      reviewsLength: reviews.length,
    });

    const docRef = db.collection("google_reviews").doc("summary");

    await docRef.set({
      reviews,
      averageRating,
      reviewCount,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.log(`✅ Successfully fetched and stored ${reviewCount} reviews for ${placeData.name}.`);
  } catch (error) {
    const err = error as { response?: { data: unknown }; message: string };
    logger.error("❌ Error fetching Google Place details:", {
      error: err.response ? err.response.data : err.message,
    });
  }
});