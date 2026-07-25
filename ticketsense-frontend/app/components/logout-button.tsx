"use client";

import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  useState,
} from "react";
import { logoutUser } from "@/lib/api";

type LogoutButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function LogoutButton({
  children,
  disabled,
  onClick,
  ...props
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logoutUser();
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <button
      {...props}
      disabled={disabled || isLoggingOut}
      onClick={handleClick}
      type="button"
    >
      {isLoggingOut ? "Signing out…" : children}
    </button>
  );
}
