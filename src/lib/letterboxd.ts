import { decode } from "html-entities";

const LETTERBOXD_BASE = "letterboxd.com";

export type LetterboxdMetadata = {
  title?: string;
  description?: string;
  posterImage?: string;
  runtimeMinutes?: number;
  director?: string;
};

const OG_REGEX = (property: string) =>
  new RegExp(`<meta[^>]+property="og:${property}"[^>]+content="([^"]+)"`, "i");

const JSON_DATA_REGEX = /<script[^>]+id="film-page-deferred-data"[^>]*>(.*?)<\/script>/i;
const DURATION_REGEX = /"duration":"PT(\d+)M"/i;
const DIRECTOR_REGEX = /"director":\[{"name":"([^"]+)"/i;

function ensureAbsoluteUrl(url: string | undefined) {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  if (url.startsWith("/")) {
    return `https://www.${LETTERBOXD_BASE}${url}`;
  }
  return url;
}

export async function fetchLetterboxdMetadata(
  letterboxdUrl: string,
): Promise<LetterboxdMetadata | null> {
  try {
    const response = await fetch(letterboxdUrl, {
      headers: {
        "user-agent":
          process.env.LETTERBOXD_USER_AGENT ??
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const metadata: LetterboxdMetadata = {};

    const ogTitle = html.match(OG_REGEX("title"));
    if (ogTitle?.[1]) {
      const decoded = decode(ogTitle[1]);
      metadata.title = decoded.replace(/\s+•.+$/, "");
    }

    const ogDescription = html.match(OG_REGEX("description"));
    if (ogDescription?.[1]) {
      metadata.description = decode(ogDescription[1]);
    }

    const ogImage = html.match(OG_REGEX("image"));
    if (ogImage?.[1]) {
      metadata.posterImage = ensureAbsoluteUrl(decode(ogImage[1]));
    }

    const jsonDataMatch = html.match(JSON_DATA_REGEX);
    if (jsonDataMatch?.[1]) {
      const jsonData = jsonDataMatch[1];
      const durationMatch = jsonData.match(DURATION_REGEX);
      if (durationMatch?.[1]) {
        metadata.runtimeMinutes = Number(durationMatch[1]);
      }
      const directorMatch = jsonData.match(DIRECTOR_REGEX);
      if (directorMatch?.[1]) {
        metadata.director = decode(directorMatch[1]);
      }
    }

    return metadata;
  } catch (error) {
    console.error("Failed to fetch Letterboxd metadata", error);
    return null;
  }
}
