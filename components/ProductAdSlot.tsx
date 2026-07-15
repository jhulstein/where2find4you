import { ExternalLink, PackageCheck } from "lucide-react";
import {
  amazonAffiliateDisclosure,
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
      ? "mt-4 grid gap-4 border-t border-slate-100 pt-3 sm:grid-cols-2"
      : "mt-4 grid gap-4 border-t border-slate-100 pt-3";

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Affiliate recommendations"
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Affiliate recommendation
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            {variant === "aside" ? "Helpful product pick" : "Relevant product picks"}
          </h2>
          {contextLabel ? (
            <p className="mt-1 text-sm text-slate-500">{contextLabel}</p>
          ) : null}
        </div>
        <div className="rounded-lg bg-slate-50 p-2 text-teal-700">
          <PackageCheck aria-hidden="true" size={18} />
        </div>
      </div>

      <div className={productGridClassName}>
        {visibleProducts.map((product) => (
          <a
            key={product.id}
            href={product.url}
            target="_blank"
            rel="sponsored noreferrer"
            className="group block transition hover:text-teal-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {product.source === "amazon" ? "Amazon" : "Partner"}
                </p>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                  {product.title}
                </h3>
              </div>
              <ExternalLink
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition group-hover:text-teal-700"
                size={15}
              />
            </div>
            {product.description ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                {product.description}
              </p>
            ) : null}
            {productMeta(product) ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                {productMeta(product)}
              </p>
            ) : null}
          </a>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {amazonAffiliateDisclosure}
      </p>
    </aside>
  );
}
