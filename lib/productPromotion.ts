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

type ProductSelectionOptions = {
  category?: string | null;
  limit?: number;
  query?: string | null;
  tags?: string[];
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

function readableTitleFromPath(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);
  const asinIndex = parts.findIndex((part) => /^[A-Z0-9]{10}$/i.test(part));
  const previousPart = asinIndex > 0 ? parts[asinIndex - 1] : null;
  const titlePart =
    previousPart && /^(dp|product|asin)$/i.test(previousPart) && asinIndex > 1
      ? parts[asinIndex - 2]
      : asinIndex > 0
        ? previousPart
        : parts.find((part) => !/^(dp|gp|product|exec|obidos|asin)$/i.test(part));

  if (
    !titlePart ||
    /^[A-Z0-9]{10}$/i.test(titlePart) ||
    /^(dp|gp|product|exec|obidos|asin)$/i.test(titlePart)
  ) {
    return null;
  }

  const title = titlePart
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return title.length > 2 ? title : null;
}

function titleFromUrl(url: URL) {
  const pathTitle = readableTitleFromPath(url);

  if (pathTitle) {
    return pathTitle;
  }

  const asin = extractAsin(url);

  if (asin) {
    return `Amazon product ${asin}`;
  }

  return url.hostname.replace(/^www\./, "");
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

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isGenericAmazonTitleValue(value: string) {
  return /^amazon product [A-Z0-9]{10}$/i.test(value.trim());
}

function productFromJson(value: unknown, index: number): PromotedProduct | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const parsedUrl = safeUrl(stringValue(candidate.url) ?? "");

  if (!parsedUrl) {
    return null;
  }

  const source = candidate.source === "external" ? "external" : isAmazonHost(parsedUrl.hostname) ? "amazon" : "external";
  const savedTitle = optionalString(candidate.title);
  const urlTitle = titleFromUrl(parsedUrl);
  const title =
    savedTitle && !isGenericAmazonTitleValue(savedTitle) ? savedTitle : urlTitle;

  return {
    affiliateTag: optionalString(candidate.affiliateTag) ?? parsedUrl.searchParams.get("tag"),
    asin: optionalString(candidate.asin) ?? extractAsin(parsedUrl),
    category: optionalString(candidate.category),
    description: optionalString(candidate.description),
    id: optionalString(candidate.id) ?? productId(parsedUrl, index),
    imageUrl: optionalString(candidate.imageUrl),
    price: optionalString(candidate.price),
    source,
    title,
    url: parsedUrl.toString(),
  };
}

export function parsePromotedProductsJson(input: string | null | undefined) {
  if (!input?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(input);
    const products: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray(parsed.products)
        ? parsed.products
        : [];

    return products
      .map((product, index) => productFromJson(product, index))
      .filter((product: PromotedProduct | null): product is PromotedProduct => Boolean(product));
  } catch {
    return [];
  }
}

function tokenize(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2);
}

function productText(product: PromotedProduct) {
  return [
    product.title,
    product.description,
    product.category,
    product.asin,
    product.source,
  ]
    .filter(Boolean)
    .join(" ");
}

export function selectPromotedProducts(
  products: PromotedProduct[],
  options: ProductSelectionOptions = {},
) {
  const limit = Math.max(0, options.limit ?? 2);

  if (limit === 0 || products.length === 0) {
    return [];
  }

  const contextTokens = new Set([
    ...tokenize(options.query),
    ...tokenize(options.category),
    ...(options.tags ?? []).flatMap(tokenize),
  ]);

  const scored = products.map((product, index) => {
    const tokens = new Set(tokenize(productText(product)));
    let score = 0;

    for (const token of contextTokens) {
      if (tokens.has(token)) {
        score += 1;
      }
    }

    if (options.category && product.category) {
      const categoryTokens = tokenize(options.category);
      const productCategoryTokens = new Set(tokenize(product.category));

      if (categoryTokens.some((token) => productCategoryTokens.has(token))) {
        score += 4;
      }
    }

    return { index, product, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((item) => item.product);
}

function isAmazonShortCodeTitle(product: PromotedProduct) {
  try {
    const url = new URL(product.url);

    return (
      product.source === "amazon" &&
      /(^|\.)amzn\./i.test(url.hostname) &&
      /^[a-z0-9]{5,14}$/i.test(product.title.trim())
    );
  } catch {
    return false;
  }
}

function isGenericAmazonTitle(product: PromotedProduct) {
  return isGenericAmazonTitleValue(product.title);
}

export function displayPromotedProductTitle(product: PromotedProduct, index = 0) {
  try {
    const url = new URL(product.url);
    const titleFromProductUrl = titleFromUrl(url);
    const titleIsGeneric = isGenericAmazonTitle(product) || isAmazonShortCodeTitle(product);

    if (titleIsGeneric && titleFromProductUrl !== product.title) {
      return titleFromProductUrl;
    }
  } catch {
    // Keep the saved title if the URL is not parseable.
  }

  if (isAmazonShortCodeTitle(product)) {
    return product.category ? `Amazon ${product.category} pick` : `Amazon pick ${index + 1}`;
  }

  return product.title;
}

export function displayPromotedProductDescription(product: PromotedProduct) {
  if (product.description) {
    return product.description;
  }

  if (product.category) {
    return `A related ${product.category} recommendation.`;
  }

  return product.source === "amazon"
    ? "A related Amazon product recommendation."
    : "A related product recommendation.";
}

export const amazonAffiliateDisclosure =
  "As an Amazon Associate I earn from qualifying purchases.";
