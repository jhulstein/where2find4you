import { redirect } from "next/navigation";

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  redirect(`/search?location=${encodeURIComponent(slug)}`);
}
