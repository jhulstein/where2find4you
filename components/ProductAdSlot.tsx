import { ExternalLink, PackageCheck } from "lucide-react";
import {
  amazonAffiliateDisclosure,
  displayPromotedProductDescription,
  displayPromotedProductTitle,
  type PromotedProduct,
} from "@/lib/productPromotion";

type ProductAdSlotProps = {
  className?: string;
  contextLabel?: string;
  products: PromotedProduct[];
  variant?: "inline" | "aside";
};

function productMeta(product: PromotedProduct) {
  return [product.category, product.price].filter(Boolean).join(" - ");
}

export function ProductAdSlot({
  className = "",
  contextLabel,
  products,
  variant = "inline",
}: ProductAdSlotProps) {
  const visibleProducts = products.slice(0, variant === "aside" ? 1 : 2);
  const productGridClassName =
    visibleProducts.length > 1
      ? "grid divide-y divide-teal-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
      : "grid divide-y divide-teal-100";

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Affiliate recommendations"
      className={`overflow-hidden rounded-xl border border-teal-200 bg-teal-50 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-teal-100 bg-white px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
              Sponsored picks
            </p>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-800">
              Affiliate
            </span>
          </div>
          {contextLabel ? (
            <p className="mt-1 text-sm text-slate-500">{contextLabel}</p>
          ) : null}
        </div>
        <div className="rounded-full bg-teal-700 p-2 text-white">
          <PackageCheck aria-hidden="true" size={18} />
        </div>
      </div>

      <div className={productGridClassName}>
        {visibleProducts.map((product, index) => (
          <a
            key={product.id}
            href={product.url}
            target="_blank"
            rel="sponsored noreferrer"
            className="group flex min-h-[96px] items-start gap-3 px-4 py-4 transition hover:bg-white/70"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm ring-1 ring-teal-100">
              <PackageCheck aria-hidden="true" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                {product.source === "amazon" ? "Amazon" : "Partner"}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                {displayPromotedProductTitle(product, index)}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {displayPromotedProductDescription(product)}
              </p>
              {productMeta(product) ? (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {productMeta(product)}
                </p>
              ) : null}
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 transition group-hover:text-teal-950">
                View product
                <ExternalLink aria-hidden="true" size={13} />
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="border-t border-teal-100 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500">
        {amazonAffiliateDisclosure}
      </p>
    </aside>
  );
}
