import { BadgeCheck } from "lucide-react";

export function SponsoredBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
      <BadgeCheck aria-hidden="true" size={13} />
      Sponsored
    </span>
  );
}
