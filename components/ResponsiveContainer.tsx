import type { ReactNode } from "react";

type ResponsiveContainerProps = {
  children: ReactNode;
  className?: string;
};

export function ResponsiveContainer({
  children,
  className = "",
}: ResponsiveContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
