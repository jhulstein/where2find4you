"use client";

import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import type { ClickType } from "@/lib/types";
import { trackPlaceClick } from "@/components/clientTracking";

type TrackingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  clickType: ClickType;
  placeId: string;
  searchId?: string | null;
};

export function TrackingButton({
  children,
  clickType,
  onClick,
  placeId,
  searchId,
  type = "button",
  ...props
}: TrackingButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);

    if (!event.defaultPrevented) {
      trackPlaceClick({ placeId, clickType, searchId });
    }
  }

  return (
    <button {...props} type={type} onClick={handleClick}>
      {children}
    </button>
  );
}
