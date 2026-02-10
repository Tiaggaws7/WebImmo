import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
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
 * 📌 Place ID de test : Century 21 Bastille (Paris) → ChIJy6Ot1cly5kcRuXFD2LxGLQc
 *
 * Configuration des secrets Firebase :
 *    firebase functions:secrets:set GOOGLE_API_KEY     → votre clé API Google Places
 *    firebase functions:secrets:set GOOGLE_PLACE_ID    → ChIJy6Ot1cly5kcRuXFD2LxGLQc
 *    firebase deploy --only functions
 *
 * ⚠️ Pour passer à votre vraie agence, changez simplement le GOOGLE_PLACE_ID
 */

/**
 * Fonction utilitaire — récupère les avis Google et les stocke dans Firestore
 */
async function fetchAndStoreReviews(apiKey: string, placeId: string): Promise<string> {
  logger.log("📡 Fetching from Google Places API...");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total,types&key=${apiKey}&language=fr`;

  const response = await axios.get(url);

  logger.log("API Response received:", { status: response.data.status });

  if (response.data.status !== "OK") {
    const errorMsg = `Google API error: ${response.data.status} - ${response.data.error_message || "Unknown error"}`;
    logger.error("❌ " + errorMsg);
    throw new Error(errorMsg);
  }

  const placeData = response.data.result;

  if (!placeData) {
    throw new Error(`No place data found for Place ID: ${placeId}`);
  }

  const reviews = placeData.reviews || [];
  const averageRating = placeData.rating || 0;
  const reviewCount = placeData.user_ratings_total || 0;
  const businessName = placeData.name || "";
  const businessType = placeData.types || [];

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

  const successMsg = `Successfully fetched and stored ${reviews.length} reviews for ${placeData.name} (${averageRating}★, ${reviewCount} total reviews).`;
  logger.log("✅ " + successMsg);
  return successMsg;
}

/**
 * Scheduled Cloud Function — runs every 24 hours to fetch Google reviews automatically.
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

    try {
      await fetchAndStoreReviews(apiKey, placeId);
    } catch (error) {
      const err = error as { response?: { data: unknown }; message: string };
      logger.error("❌ Error fetching Google Place details:", {
        error: err.response ? err.response.data : err.message,
      });
    }
  }
);

/**
 * HTTP Trigger — allows manually fetching reviews by visiting the function URL.
 * Usage: visit the function URL in your browser to trigger a fetch immediately.
 * Example: https://us-central1-YOUR_PROJECT.cloudfunctions.net/triggerFetchGoogleReviews
 */
export const triggerFetchGoogleReviews = onRequest(
  {
    secrets: [googleApiKey, googlePlaceId],
    cors: true,
  },
  async (req, res) => {
    logger.log("🔄 Manual Google Reviews fetch triggered...");

    const apiKey = googleApiKey.value();
    const placeId = googlePlaceId.value();

    if (!apiKey || !placeId) {
      res.status(500).json({
        success: false,
        error: "GOOGLE_API_KEY or GOOGLE_PLACE_ID secret is not configured.",
      });
      return;
    }

    try {
      const message = await fetchAndStoreReviews(apiKey, placeId);
      res.status(200).json({ success: true, message });
    } catch (error) {
      const err = error as { response?: { data: unknown }; message: string };
      res.status(500).json({
        success: false,
        error: err.message,
        details: err.response ? err.response.data : undefined,
      });
    }
  }
);