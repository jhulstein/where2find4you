export type PromotedProduct = {
  affiliateTag: string | null;
  asin: string | null;
  category: string | null;
  description: string | null;
  id: string;
  imageUrl: string | null;
  price: string | null;
  source: "amazon" | "external";
  title: string;
  url: string;
};

export type ProductParseWarning = {
  line: string;
  message: string;
};

type ParseProductOptions = {
  associateTag?: string | null;
};

function isUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function cleanUrlCandidate(value: string) {
  return value.trim().replace(/[),.;\]]+$/g, "");
}

function safeUrl(value: string) {
  try {
    return new URL(cleanUrlCandidate(value));
  } catch {
    return null;
  }
}

function isAmazonHost(hostname: string) {
  return /(^|\.)amazon\./i.test(hostname) || /(^|\.)amzn\./i.test(hostname);
}

function extractAsin(url: URL) {
  const asinMatch = url.pathname.match(
    /\/(?:dp|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})(?:[/?]|$)/i,
  );

  return asinMatch?.[1]?.toUpperCase() ?? null;
}

function titleFromUrl(url: URL) {
  const asin = extractAsin(url);

  if (asin) {
    return `Amazon product ${asin}`;
  }

  const pathTitle = url.pathname
    .split("/")
    .filter(Boolean)
    .find((part) => !/^[A-Z0-9]{10}$/i.test(part));

  return pathTitle
    ? pathTitle.replace(/[-_]+/g, " ").trim()
    : url.hostname.replace(/^www\./, "");
}

function productId(url: URL, index: number) {
  const asin = extractAsin(url);
  const base = asin ?? `${url.hostname}-${url.pathname}`;
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `product-${slug || index + 1}`;
}

function normalizeProductUrl(url: URL, associateTag: string | null | undefined) {
  if (!isAmazonHost(url.hostname)) {
    return url;
  }

  if (associateTag && !url.searchParams.has("tag")) {
    url.searchParams.set("tag", associateTag);
  }

  return url;
}

function urlFromLine(line: string) {
  return line.match(/https?:\/\/\S+/i)?.[0] ?? null;
}

function parsePipeLine(line: string, index: number, associateTag: string | null | undefined) {
  const parts = line.split("|").map((part) => part.trim());
  const urlIndex = parts.findIndex(isUrl);

  if (urlIndex === -1) {
    return null;
  }

  const parsedUrl = safeUrl(parts[urlIndex]);

  if (!parsedUrl) {
    return null;
  }

  const normalizedUrl = normalizeProductUrl(parsedUrl, associateTag);
  const title = urlIndex > 0 && parts[0] ? parts[0] : titleFromUrl(normalizedUrl);
  const trailing = parts.slice(urlIndex + 1);

  return {
    affiliateTag: normalizedUrl.searchParams.get("tag"),
    asin: extractAsin(normalizedUrl),
    category: trailing[3] || null,
    description: trailing[0] || null,
    id: productId(normalizedUrl, index),
    imageUrl: trailing[1] && isUrl(trailing[1]) ? trailing[1] : null,
    price: trailing[2] || null,
    source: isAmazonHost(normalizedUrl.hostname) ? "amazon" as const : "external" as const,
    title,
    url: normalizedUrl.toString(),
  };
}

function parseUrlLine(line: string, index: number, associateTag: string | null | undefined) {
  const urlCandidate = urlFromLine(line);

  if (!urlCandidate) {
    return null;
  }

  const parsedUrl = safeUrl(urlCandidate);

  if (!parsedUrl) {
    return null;
  }

  const normalizedUrl = normalizeProductUrl(parsedUrl, associateTag);
  const title = line
    .replace(urlCandidate, "")
    .replace(/\s+\|\s+$/g, "")
    .trim();

  return {
    affiliateTag: normalizedUrl.searchParams.get("tag"),
    asin: extractAsin(normalizedUrl),
    category: null,
    description: null,
    id: productId(normalizedUrl, index),
    imageUrl: null,
    price: null,
    source: isAmazonHost(normalizedUrl.hostname) ? "amazon" as const : "external" as const,
    title: title || titleFromUrl(normalizedUrl),
    url: normalizedUrl.toString(),
  };
}

export function parsePromotedProducts(input: string, options: ParseProductOptions = {}) {
  const associateTag = options.associateTag?.trim() || null;
  const warnings: ProductParseWarning[] = [];
  const seen = new Set<string>();
  const products = input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const parsed =
        line.includes("|")
          ? parsePipeLine(line, index, associateTag) ?? parseUrlLine(line, index, associateTag)
          : parseUrlLine(line, index, associateTag);

      if (!parsed) {
        warnings.push({
          line,
          message: "Could not find a valid product URL.",
        });
        return [];
      }

      if (parsed.source === "amazon" && !parsed.affiliateTag) {
        warnings.push({
          line,
          message: "Amazon link has no affiliate tag.",
        });
      }

      const duplicateKey = parsed.asin ?? parsed.url;

      if (seen.has(duplicateKey)) {
        return [];
      }

      seen.add(duplicateKey);
      return [parsed];
    });

  return { products, warnings };
}

export const amazonAffiliateDisclosure =
  "As an Amazon Associate I earn from qualifying purchases.";
