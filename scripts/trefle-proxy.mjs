import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const PORT = Number(process.env.TREFLE_PROXY_PORT || 8787);
const TARGET_ORIGIN = "https://trefle.io";
const API_VERSION = "/api/v1";

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  // Trefle API requires /api/v1 prefix
  const targetUrl = new URL(
    API_VERSION + requestUrl.pathname + requestUrl.search,
    TARGET_ORIGIN,
  );

  const proxyRequest = https.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host,
        origin: TARGET_ORIGIN,
      },
    },
    (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode || 500, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type":
          proxyResponse.headers["content-type"] || "application/json",
      });

      proxyResponse.pipe(res, { end: true });
    },
  );

  proxyRequest.on("error", (error) => {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message }));
  });

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  req.pipe(proxyRequest, { end: true });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Trefle proxy listening on http://127.0.0.1:${PORT}`);
});
