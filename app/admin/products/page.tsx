import { AdminNav } from "@/components/AdminNav";
import { ProductPromotionBuilder } from "@/components/ProductPromotionBuilder";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export default function AdminProductsPage() {
  const associateTag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? "";

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">Patchen</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Paste products to promote
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Build a clean Patchen list from pasted links, keep affiliate disclosure visible,
            and prepare promotion data for pages, posts and recommendations.
          </p>
        </div>

        <ProductPromotionBuilder associateTag={associateTag} />
      </ResponsiveContainer>
    </main>
  );
}
