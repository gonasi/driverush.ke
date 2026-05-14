#!/usr/bin/env node
/**
 * Ping IndexNow with the URLs currently in our sitemap. IndexNow is supported
 * by Bing, Yandex, Naver and Seznam — one POST goes to api.indexnow.org and
 * fans out to all of them.
 *
 * Run after a deploy:
 *   npm run ping-indexnow                  # pings every URL in /sitemap.xml
 *   npm run ping-indexnow -- /foo /bar     # pings only these site-relative paths
 *
 * IndexNow verifies ownership by fetching a key file at the site root. Our key
 * lives at public/<KEY>.txt and is reproduced in KEY below — both must match
 * or IndexNow returns 403 Forbidden.
 *
 * Spec: https://www.indexnow.org/documentation
 */

const HOST = "driverush.ke";
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const KEY = "068680a368744db47e68840381d4d86d";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL, {
    headers: { Accept: "application/xml" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: HTTP ${res.status}`);
  }
  const xml = await res.text();
  // Plain-text extraction is fine here — the sitemap is small and machine-
  // generated, so we don't need a real XML parser.
  const matches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)];
  return matches.map((m) => m[1].trim());
}

function urlsFromCliArgs(args) {
  return args.map((a) => {
    if (a.startsWith("http")) return a;
    const path = a.startsWith("/") ? a : `/${a}`;
    return `https://${HOST}${path}`;
  });
}

async function pingIndexNow(urlList) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  const cliPaths = process.argv.slice(2);
  const urls =
    cliPaths.length > 0 ? urlsFromCliArgs(cliPaths) : await fetchSitemapUrls();

  if (urls.length === 0) {
    console.error("No URLs to ping.");
    process.exit(1);
  }

  console.log(`Pinging IndexNow with ${urls.length} URL(s) for ${HOST}:`);
  for (const u of urls) console.log("  -", u);

  const { status, text } = await pingIndexNow(urls);
  // IndexNow returns 200 (OK) or 202 (Accepted, queued). Anything else is a
  // failure to surface loudly so it doesn't get missed in deploy logs.
  if (status === 200 || status === 202) {
    console.log(`\nIndexNow accepted: HTTP ${status}`);
    return;
  }
  console.error(`\nIndexNow rejected: HTTP ${status}\n${text}`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
