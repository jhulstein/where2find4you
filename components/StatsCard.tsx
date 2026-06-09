import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  note?: string;
};

export function StatsCard({ label, value, icon: Icon, note }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
          <Icon aria-hidden="true" size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      {note ? <p className="mt-1 text-sm text-slate-500">{note}</p> : null}
    </div>
  );
}
