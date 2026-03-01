import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();

// Secrets
const googleMapsUrl = defineSecret("GOOGLE_MAPS_URL");

// --- Types ---
interface ScrapedReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url: string;
}

interface ScrapedData {
  reviews: ScrapedReview[];
  averageRating: number;
  reviewCount: number;
  businessName: string;
  googleMapsUrl: string;
}

/**
 * Scrape les avis Google depuis la page Google Maps
 * Utilise Puppeteer (Chrome headless) pour naviguer et extraire les données.
 */
async function scrapeGoogleMapsReviews(mapsUrl: string): Promise<ScrapedData> {
  logger.log("🌐 Lancement du navigateur headless...");

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1920, height: 1080 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // User-Agent réaliste
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Bloquer les images et CSS pour accélérer le chargement
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (type === "image" || type === "stylesheet" || type === "font") {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Force language to French
    const urlWithLang = mapsUrl.includes("hl=") ? mapsUrl : `${mapsUrl}&hl=fr`;
    logger.log("📄 Navigation vers", urlWithLang);
    await page.goto(urlWithLang, { waitUntil: "networkidle2", timeout: 30000 });

    // Accepter les cookies Google si dialogue présent
    try {
      const consentBtn = await page.waitForSelector(
        "button[aria-label=\"Tout accepter\"], button[aria-label=\"Accept all\"], form[action*=\"consent\"] button",
        { timeout: 5000 }
      );
      if (consentBtn) {
        await consentBtn.click();
        logger.log("🍪 Cookies acceptés");
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch {
      // Pas de dialogue de cookies
    }

    // Attendre que la page soit chargée
    await new Promise((r) => setTimeout(r, 3000));

    // Cliquer sur l'onglet "Avis" s'il existe
    try {
      const reviewsTab = await page.waitForSelector(
        "button[aria-label*=\"Avis\"], button[aria-label*=\"Reviews\"], button[data-tab-index=\"1\"]",
        { timeout: 5000 }
      );
      if (reviewsTab) {
        await reviewsTab.click();
        logger.log("📋 Onglet Avis cliqué");
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch {
      logger.log("⚠️ Onglet Avis non trouvé via sélecteur, essai via index...");
      // Fallback: try click the second tab button
      await page.evaluate(() => {
        const tabs = document.querySelectorAll("button[role=\"tab\"]");
        if (tabs.length > 1) (tabs[1] as HTMLElement).click();
      });
    }

    // Scroller le panel des avis pour charger tous les avis
    const scrolled = await page.evaluate(async () => {
      const scrollable = document.querySelector(
        "div.m6QErb.DxyBCb.kA9KIf.dS8AEf"
      );
      if (!scrollable) return false;

      for (let i = 0; i < 15; i++) {
        scrollable.scrollTop += 800;
        await new Promise((r) => setTimeout(r, 600));
      }
      return true;
    });
    logger.log(scrolled ? "📜 Panel scrollé" : "⚠️ Panel non trouvé");

    // Cliquer sur les boutons "Plus" pour développer les avis tronqués
    await page.evaluate(() => {
      document
        .querySelectorAll("button[aria-label*=\"Voir plus\"], button.w8nwRe.kyuRq")
        .forEach((btn) => (btn as HTMLElement).click());
    });
    await new Promise((r) => setTimeout(r, 500));

    // Extraire les données des avis
    const data = await page.evaluate(() => {
      const reviewElements = document.querySelectorAll(".jftiEf");
      const seenAuthors = new Set<string>();
      const reviews: {
        author_name: string;
        rating: number;
        text: string;
        relative_time_description: string;
        profile_photo_url: string;
      }[] = [];

      reviewElements.forEach((el) => {
        const author =
          (el.querySelector(".d4r55") as HTMLElement)?.innerText
            ?.split("\n")[0]
            ?.trim() || "";

        if (!author || seenAuthors.has(author)) return;
        seenAuthors.add(author);

        const ratingText =
          el.querySelector(".kvMYyc")?.getAttribute("aria-label") || "";
        const ratingMatch = ratingText.match(/\d+/);
        const rating = ratingMatch ? parseInt(ratingMatch[0]) : 5;

        const text =
          (el.querySelector(".wiHb6") as HTMLElement)?.innerText?.trim() || "";

        const date =
          (el.querySelector(".rsqa6f, .DU9u6") as HTMLElement)?.innerText?.trim() || "";

        const photoEl = el.querySelector("img.NBa79c") as HTMLImageElement;
        const photo = photoEl?.src || "";

        reviews.push({
          author_name: author,
          rating,
          text,
          relative_time_description: date,
          profile_photo_url: photo,
        });
      });

      // Infos business
      const businessName =
        (document.querySelector(".DUwDvf") as HTMLElement)?.innerText?.trim() || "";

      // Note moyenne
      const ratingEl = document.querySelector(".F7nice span") as HTMLElement;
      const avgRating = ratingEl
        ? parseFloat(ratingEl.innerText.replace(",", "."))
        : 0;

      // Nombre total d'avis (chercher dans le texte "XX avis")
      let totalReviews = reviews.length;
      const reviewCountText = document.querySelector(
        "button[aria-label*=\"avis\"]"
      )?.getAttribute("aria-label") || "";
      const countMatch = reviewCountText.match(/(\d+)/);
      if (countMatch) totalReviews = parseInt(countMatch[1]);

      return { reviews, businessName, avgRating, totalReviews };
    });

    logger.log("📊 Données extraites:", {
      businessName: data.businessName,
      reviewCount: data.reviews.length,
      avgRating: data.avgRating,
      totalReviews: data.totalReviews,
    });

    return {
      reviews: data.reviews.map((r) => ({
        ...r,
        time: Math.floor(Date.now() / 1000),
      })),
      averageRating: data.avgRating || 5.0,
      reviewCount: data.totalReviews,
      businessName: data.businessName || "Elise BUIL",
      googleMapsUrl: mapsUrl,
    };
  } finally {
    await browser.close();
    logger.log("🔒 Navigateur fermé");
  }
}

/**
 * Stocker les données scrapées dans Firestore
 */
async function storeReviews(data: ScrapedData): Promise<string> {
  await db.collection("google_reviews").doc("summary").set({
    reviews: data.reviews,
    averageRating: data.averageRating,
    reviewCount: data.reviewCount,
    businessName: data.businessName,
    businessType: ["real_estate_agency"],
    googleMapsUrl: data.googleMapsUrl,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    source: "puppeteer_scrape",
  });

  const msg = `Scraped ${data.reviews.length} reviews for "${data.businessName}" (${data.averageRating}★, ${data.reviewCount} total).`;
  logger.log("✅", msg);
  return msg;
}

/**
 * Scheduled Cloud Function — toutes les 24h
 * Scrape les avis Google et les stocke dans Firestore.
 * Config : 2 Go RAM, 120s timeout (Puppeteer/Chromium nécessite ça).
 */
export const fetchGoogleReviews = onSchedule(
  {
    schedule: "every 24 hours",
    secrets: [googleMapsUrl],
    memory: "2GiB",
    timeoutSeconds: 120,
  },
  async () => {
    logger.log("🔄 Scraping programmé des avis Google...");
    const url = googleMapsUrl.value();

    if (!url) {
      logger.error("❌ Secret GOOGLE_MAPS_URL non configuré.");
      return;
    }

    try {
      const data = await scrapeGoogleMapsReviews(url);
      await storeReviews(data);
    } catch (error) {
      logger.error("❌ Erreur scraping:", (error as Error).message);
      logger.log("ℹ️ Les données existantes dans Firestore sont conservées.");
    }
  }
);

/**
 * HTTP Trigger — déclencher le scraping manuellement
 * URL : https://us-central1-webimmo-6189a.cloudfunctions.net/triggerFetchGoogleReviews
 */
export const triggerFetchGoogleReviews = onRequest(
  {
    secrets: [googleMapsUrl],
    cors: true,
    memory: "2GiB",
    timeoutSeconds: 120,
  },
  async (_req, res) => {
    logger.log("🔄 Scraping manuel déclenché...");
    const url = googleMapsUrl.value();

    if (!url) {
      res.status(500).json({
        success: false,
        error: "Secret GOOGLE_MAPS_URL non configuré.",
      });
      return;
    }

    try {
      const data = await scrapeGoogleMapsReviews(url);
      const message = await storeReviews(data);
      res.status(200).json({ success: true, message, data });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
);