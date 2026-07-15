"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Clipboard,
  ExternalLink,
  PackagePlus,
  Save,
  Trash2,
} from "lucide-react";
import { ProductAdSlot } from "@/components/ProductAdSlot";
import {
  amazonAffiliateDisclosure,
  displayPromotedProductDescription,
  displayPromotedProductTitle,
  parsePromotedProducts,
  type PromotedProduct,
} from "@/lib/productPromotion";

const storageKey = "where2find4you_promoted_products";

function subscribeToProducts(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", callback);
  window.addEventListener("where2find4you-products-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("where2find4you-products-updated", callback);
  };
}

function productSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(storageKey) ?? "[]";
}

function savedProductsFromSnapshot(snapshot: string) {
  try {
    const products = JSON.parse(snapshot);

    return Array.isArray(products) ? (products as PromotedProduct[]) : [];
  } catch {
    return [];
  }
}

function updateSavedProducts(products: PromotedProduct[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(products, null, 2));
  window.dispatchEvent(new Event("where2find4you-products-updated"));
}

function optionalText(value: string) {
  return value.trim() || null;
}

function productMergeKey(product: PromotedProduct) {
  return product.asin ?? product.id ?? product.url;
}

function mergeProducts(primaryProducts: PromotedProduct[], secondaryProducts: PromotedProduct[]) {
  const seen = new Set<string>();
  const merged: PromotedProduct[] = [];

  for (const product of [...primaryProducts, ...secondaryProducts]) {
    const key = productMergeKey(product);

    if (!seen.has(key)) {
      seen.add(key);
      merged.push(product);
    }
  }

  return merged;
}

function ProductThumbnail({ product }: { product: PromotedProduct }) {
  if (product.imageUrl) {
    return (
      <div
        aria-hidden="true"
        className="h-14 w-14 shrink-0 rounded-lg bg-slate-100 bg-cover bg-center ring-1 ring-slate-200"
        style={{ backgroundImage: `url(${product.imageUrl})` }}
      />
    );
  }

  return <PackagePlus aria-hidden="true" className="shrink-0 text-teal-700" size={20} />;
}

type ProductEditorProps = {
  index: number;
  onRemove: () => void;
  onUpdate: (product: PromotedProduct) => void;
  product: PromotedProduct;
};

function ProductEditor({ index, onRemove, onUpdate, product }: ProductEditorProps) {
  function updateField<Key extends keyof PromotedProduct>(
    key: Key,
    value: PromotedProduct[Key],
  ) {
    onUpdate({ ...product, [key]: value });
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <ProductThumbnail product={product} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-950">
              {displayPromotedProductTitle(product, index)}
            </p>
            <p className="truncate text-sm text-slate-500">{product.url}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Trash2 aria-hidden="true" size={15} />
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Title
          <input
            value={product.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Image URL
          <input
            value={product.imageUrl ?? ""}
            onChange={(event) => updateField("imageUrl", optionalText(event.target.value))}
            placeholder="https://..."
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">
          Description
          <input
            value={product.description ?? ""}
            onChange={(event) => updateField("description", optionalText(event.target.value))}
            placeholder={displayPromotedProductDescription(product)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Price
          <input
            value={product.price ?? ""}
            onChange={(event) => updateField("price", optionalText(event.target.value))}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Category
          <input
            value={product.category ?? ""}
            onChange={(event) => updateField("category", optionalText(event.target.value))}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          />
        </label>
      </div>
    </div>
  );
}

function ProductCard({ index, product }: { index: number; product: PromotedProduct }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            {product.source === "amazon" ? "Amazon affiliate" : "External product"}
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-950">
            {displayPromotedProductTitle(product, index)}
          </h3>
        </div>
        <ProductThumbnail product={product} />
      </div>
      {product.description ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p>
      ) : null}
      <div className="mt-4 grid gap-1 text-xs text-slate-500">
        {product.asin ? <p>ASIN: {product.asin}</p> : null}
        {product.affiliateTag ? <p>Tag: {product.affiliateTag}</p> : null}
        {product.price ? <p>Price: {product.price}</p> : null}
        {product.category ? <p>Category: {product.category}</p> : null}
      </div>
      <a
        href={product.url}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Open product
        <ExternalLink aria-hidden="true" size={15} />
      </a>
    </article>
  );
}

export function ProductPromotionBuilder({ associateTag = "" }: { associateTag?: string }) {
  const [rawProducts, setRawProducts] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const savedSnapshot = useSyncExternalStore(
    subscribeToProducts,
    productSnapshot,
    () => "[]",
  );
  const savedProducts = useMemo(
    () => savedProductsFromSnapshot(savedSnapshot),
    [savedSnapshot],
  );
  const parsed = useMemo(
    () => parsePromotedProducts(rawProducts, { associateTag }),
    [associateTag, rawProducts],
  );
  const adPreviewProducts = useMemo(
    () =>
      parsed.products.length > 0
        ? mergeProducts(parsed.products, savedProducts)
        : savedProducts,
    [parsed.products, savedProducts],
  );

  async function copyText(text: string, message: string) {
    if (!("clipboard" in navigator)) {
      setStatus("Clipboard is not available in this browser.");
      return;
    }

    await navigator.clipboard.writeText(text);
    setStatus(message);
  }

  function saveParsedProducts() {
    if (parsed.products.length === 0) {
      setStatus("Paste at least one valid product URL first.");
      return;
    }

    const existingKeys = new Set(savedProducts.map(productMergeKey));
    const newProducts = parsed.products.filter((product) => !existingKeys.has(productMergeKey(product)));
    const nextProducts = [...savedProducts, ...newProducts];

    updateSavedProducts(nextProducts);

    if (newProducts.length === 0) {
      setStatus("Already saved. No new products added.");
      return;
    }

    const skipped = parsed.products.length - newProducts.length;
    setStatus(
      `${newProducts.length} product${newProducts.length === 1 ? "" : "s"} added to Patchen.${
        skipped > 0 ? ` ${skipped} duplicate${skipped === 1 ? "" : "s"} skipped.` : ""
      } ${nextProducts.length} total saved.`,
    );
  }

  function removeProduct(productId: string) {
    updateSavedProducts(savedProducts.filter((product) => product.id !== productId));
    setStatus("Product removed.");
  }

  function updateProduct(updatedProduct: PromotedProduct) {
    updateSavedProducts(
      savedProducts.map((product) =>
        product.id === updatedProduct.id ? updatedProduct : product,
      ),
    );
    setStatus("Product details updated.");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-800">Patchen</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Paste products into Patchen
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              One product per line. Use a plain URL, or paste: Title | URL |
              Description | Image URL | Price | Category. Copy saved products
              into PROMOTED_PRODUCTS_JSON in Vercel to publish discreet ads.
              Full Amazon URLs can auto-fill readable titles. Images appear
              when an Image URL is included.
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
            {amazonAffiliateDisclosure}
          </div>
        </div>

        <textarea
          value={rawProducts}
          onChange={(event) => setRawProducts(event.target.value)}
          rows={8}
          placeholder="Waterproof daypack | https://www.amazon.com/dp/B000000000 | Useful bag for city trips | https://example.com/image.jpg | $49 | Travel gear"
          className="mt-5 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm leading-6 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        />

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={saveParsedProducts}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            <Save aria-hidden="true" size={16} />
            Add to Patchen
          </button>
          <button
            type="button"
            onClick={() =>
              copyText(
                JSON.stringify(parsed.products, null, 2),
                "Parsed product JSON copied.",
              )
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Clipboard aria-hidden="true" size={16} />
            Copy parsed JSON
          </button>
          <button
            type="button"
            onClick={() =>
              copyText(amazonAffiliateDisclosure, "Affiliate disclosure copied.")
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Clipboard aria-hidden="true" size={16} />
            Copy disclosure
          </button>
        </div>

        {status ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {status}
          </p>
        ) : null}

        {parsed.warnings.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <AlertTriangle aria-hidden="true" size={16} />
              Review before publishing
            </div>
            <ul className="mt-2 grid gap-1 text-sm leading-6 text-amber-900">
              {parsed.warnings.map((warning) => (
                <li key={`${warning.line}-${warning.message}`}>
                  {warning.message} <span className="font-medium">{warning.line}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {parsed.products.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-950">Preview</h2>
            <p className="text-sm text-slate-500">{parsed.products.length} parsed</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parsed.products.map((product, index) => (
              <ProductCard key={product.id} index={index} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {adPreviewProducts.length > 0 ? (
        <section>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">Ad preview</h2>
              <p className="text-sm text-slate-500">
                This is how the first picks will look in search results. New pasted products are previewed with saved drafts.
              </p>
            </div>
            <p className="text-sm text-slate-500">
              {Math.min(adPreviewProducts.length, 2)} shown in preview
            </p>
          </div>
          <ProductAdSlot
            products={adPreviewProducts}
            contextLabel="Preview only. Publish by copying ad JSON to Vercel."
          />
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-950">Saved Patchen drafts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Saved in this browser for now. Edit details here, then copy the JSON to publish.
            </p>
          </div>
          {savedProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    JSON.stringify(savedProducts, null, 2),
                    "Saved product JSON copied.",
                  )
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Clipboard aria-hidden="true" size={15} />
                Copy ad JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  updateSavedProducts([]);
                  setStatus("Saved products cleared.");
                }}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                <Trash2 aria-hidden="true" size={15} />
                Clear
              </button>
            </div>
          ) : null}
        </div>

        {savedProducts.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {savedProducts.map((product, index) => (
              <ProductEditor
                key={product.id}
                index={index}
                onRemove={() => removeProduct(product.id)}
                onUpdate={updateProduct}
                product={product}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No Patchen products saved yet.
          </p>
        )}
      </section>
    </div>
  );
}
