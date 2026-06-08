import { Star } from "lucide-react";

type ScoreBadgeProps = {
  label: string;
  score: number;
  size?: "default" | "large";
};

function scoreTone(score: number) {
  if (score >= 86) {
    return "border-teal-200 bg-teal-50 text-teal-900";
  }

  if (score >= 74) {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function ScoreBadge({
  label,
  score,
  size = "default",
}: ScoreBadgeProps) {
  const isLarge = size === "large";

  return (
    <div
      className={`rounded-lg border ${scoreTone(score)} ${
        isLarge ? "px-4 py-3" : "px-3 py-2"
      }`}
    >
      <div className="flex items-center gap-2">
        <Star aria-hidden="true" size={isLarge ? 18 : 15} />
        <span className="text-xs font-medium uppercase tracking-normal">
          {label}
        </span>
      </div>
      <p className={isLarge ? "mt-1 text-3xl font-semibold" : "text-xl font-semibold"}>
        {score}
      </p>
    </div>
  );
}
