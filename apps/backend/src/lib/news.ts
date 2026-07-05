import type { NewsArticle, NewsData } from "@repo/shared";
import NodeCache from "node-cache";

// The Tagesschau feed is heavily rate limited, so we serve a cached copy for 15 minutes
// and only ever hit the upstream API once per window regardless of how many clients poll.
const NEWS_CACHE_TTL_SECONDS = 15 * 60;
const NEWS_CACHE_KEY = "tagesschau-news";
const newsCache = new NodeCache({ stdTTL: NEWS_CACHE_TTL_SECONDS });

const DEFAULT_NEWS_URL = "https://www.tagesschau.de/api2u/news";

// Prefer a 16:9 teaser at a card-friendly size, degrading to whatever the feed offers.
const PREFERRED_IMAGE_KEYS = ["16x9-960", "16x9-640", "16x9-512", "16x9-1280", "16x9-384", "16x9-256"];

type RawImageVariants = Record<string, string | undefined>;

type RawNewsArticle = {
  sophoraId?: string;
  externalId?: string;
  title?: string;
  date?: string;
  topline?: string;
  firstSentence?: string;
  teaserImage?: { alttext?: string; imageVariants?: RawImageVariants };
  tags?: { tag?: string }[];
  type?: string;
  breakingNews?: boolean;
  detailsweb?: string;
  shareURL?: string;
};

type RawNewsResponse = { news?: RawNewsArticle[] };

function pickImageUrl(variants: RawImageVariants | undefined): string | undefined {
  if (!variants) return undefined;

  for (const key of PREFERRED_IMAGE_KEYS) {
    const url = variants[key];
    if (url) return url;
  }

  // Fall back to any remaining 16:9 variant, then any variant at all.
  const firstSixteenNine = Object.entries(variants).find(([key, value]) => key.startsWith("16x9") && value);
  if (firstSixteenNine) return firstSixteenNine[1];

  return Object.values(variants).find(Boolean);
}

function normalizeArticle(raw: RawNewsArticle): NewsArticle | null {
  const id = raw.sophoraId ?? raw.externalId;
  if (!id || !raw.title || !raw.date) return null;

  return {
    id,
    title: raw.title,
    date: raw.date,
    topline: raw.topline || undefined,
    firstSentence: raw.firstSentence || undefined,
    imageUrl: pickImageUrl(raw.teaserImage?.imageVariants),
    imageAlt: raw.teaserImage?.alttext || undefined,
    tags: (raw.tags ?? []).map((entry) => entry.tag).filter((tag): tag is string => Boolean(tag)),
    type: raw.type ?? "story",
    breakingNews: Boolean(raw.breakingNews),
    link: raw.detailsweb || raw.shareURL || undefined,
  };
}

export async function getNewsData(): Promise<NewsData> {
  const cached = newsCache.get<NewsData>(NEWS_CACHE_KEY);
  if (cached) return cached;

  const url = process.env.TAGESSCHAU_NEWS_URL || DEFAULT_NEWS_URL;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Tagesschau news API responded with ${response.status}`);
  }

  const payload = (await response.json()) as RawNewsResponse;
  const articles = (payload.news ?? [])
    .map(normalizeArticle)
    .filter((article): article is NewsArticle => article !== null);

  const data: NewsData = { articles, updatedAt: new Date().toISOString() };
  newsCache.set(NEWS_CACHE_KEY, data);
  return data;
}
