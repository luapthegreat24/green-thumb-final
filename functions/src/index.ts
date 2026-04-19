import type { Request, Response } from "express";
import * as functions from "firebase-functions";

const TREFLE_API_URL = "https://trefle.io/api/v1";

/**
 * Trefle API proxy - handles CORS and forwards requests to trefle.io
 * Supports:
 *   - GET /proxy/trefle/plants/search?q=QUERY&token=TOKEN
 *   - GET /proxy/trefle/plants/{id}?token=TOKEN
 */
export const trefleSafe = functions
  .region("us-central1")
  .https.onRequest(async (req: Request, res: Response) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Only allow GET requests
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { path, token, q: query } = req.query;

      if (!path || typeof path !== "string") {
        res.status(400).json({ error: "Missing path parameter" });
        return;
      }

      if (!token || typeof token !== "string") {
        res.status(400).json({ error: "Missing token parameter" });
        return;
      }

      // Build target URL safely
      const targetPath = `/plants/${path}`.replace(/\/+/g, "/");
      const targetUrl = new URL(TREFLE_API_URL + targetPath);
      targetUrl.searchParams.set("token", token);

      if (query && typeof query === "string") {
        targetUrl.searchParams.set("q", query);
      }

      // Forward the request to Trefle
      const response = await fetch(targetUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "GreenThumb/1.0",
        },
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("Trefle proxy error:", error);
      res.status(500).json({
        error: "Failed to fetch from Trefle API",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
