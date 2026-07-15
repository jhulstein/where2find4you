import {
  parsePromotedProductsJson,
  selectPromotedProducts,
} from "@/lib/productPromotion";

type PromotedProductContext = {
  category?: string | null;
  limit?: number;
  query?: string | null;
  tags?: string[];
};

export function getConfiguredPromotedProducts() {
  return parsePromotedProductsJson(process.env.PROMOTED_PRODUCTS_JSON);
}

export function getPromotedProductsForContext(context: PromotedProductContext = {}) {
  return selectPromotedProducts(getConfiguredPromotedProducts(), context);
}
