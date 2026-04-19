import * as functions from "firebase-functions";
/**
 * Trefle API proxy - handles CORS and forwards requests to trefle.io
 * Supports:
 *   - GET /proxy/trefle/plants/search?q=QUERY&token=TOKEN
 *   - GET /proxy/trefle/plants/{id}?token=TOKEN
 */
export declare const trefleSafe: functions.HttpsFunction;
//# sourceMappingURL=index.d.ts.map