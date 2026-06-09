"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import type { ClickType } from "@/lib/types";
import { trackPlaceClick } from "@/components/clientTracking";

type TrackingLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  clickType: ClickType;
  placeId: string;
  searchId?: string | null;
};

export function TrackingLink({
  children,
  clickType,
  onClick,
  placeId,
  searchId,
  ...props
}: TrackingLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (!event.defaultPrevented) {
      trackPlaceClick({ placeId, clickType, searchId });
    }
  }

  return (
    <a {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
