import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();

// Define secrets using the modern params package
const googleApiKey = defineSecret("GOOGLE_API_KEY");
const googlePlaceId = defineSecret("GOOGLE_PLACE_ID");

/**
 * A scheduled Cloud Function that runs every 24 hours to fetch Google reviews (v2 Syntax).
 */
export const fetchGoogleReviews = onSchedule(
  {
    schedule: "every 24 hours",
    secrets: [googleApiKey, googlePlaceId],
  },
  async () => {
    logger.log("🔄 Starting scheduled Google Reviews fetch...");

    const apiKey = googleApiKey.value();
    const placeId = googlePlaceId.value();

    if (!apiKey || !placeId) {
      logger.error("❌ API Key or Place ID is not configured.", {
        hasApiKey: !!apiKey,
        hasPlaceId: !!placeId,
      });
      return;
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total,type&key=${apiKey}&language=fr`;

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
          placeId: placeId,
        });
        return;
      }

      const reviews = placeData.reviews || [];
      const averageRating = placeData.rating || 0;
      const reviewCount = placeData.user_ratings_total || 0;
      const businessName = placeData.name || "";
      const businessType = placeData.type || [];

      logger.log("📊 Place data retrieved:", {
        name: placeData.name,
        reviewCount,
        averageRating,
        reviewsLength: reviews.length,
        businessType,
      });

      const docRef = db.collection("google_reviews").doc("summary");

      await docRef.set({
        reviews,
        averageRating,
        reviewCount,
        businessName,
        businessType,
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