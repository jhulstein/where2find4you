import type { ReactNode } from "react";

type ResponsiveTableProps = {
  children: ReactNode;
};

export function ResponsiveTable({ children }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {children}
    </div>
  );
}
