"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/lib/theme-context";

export function ThemeFab() {
  const { theme, toggleTheme } = useTheme();
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!isClient) {
    return (
      <button className="theme-fab" type="button" aria-hidden="true" tabIndex={-1}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 11a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
            fill="currentColor"
          />
        </svg>
        <span>Theme</span>
      </button>
    );
  }

  return (
    <button
      className="theme-fab"
      type="button"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
      onClick={toggleTheme}
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M14.8 3.2a.75.75 0 0 1 .83.98 7.5 7.5 0 0 0 9.2 9.2.75.75 0 0 1 .98.83A9.5 9.5 0 1 1 14.8 3.2Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V5.5a.75.75 0 0 1 .75-.75Zm0 11a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm7.25-4.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5Zm-13 0a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5h1.5Zm9.37-5.62a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06Zm-7.18 7.18a.75.75 0 0 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06Zm8.24 1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06Zm-8.24-8.24a.75.75 0 0 1 0 1.06L7.38 7.76A.75.75 0 0 1 6.32 6.7l1.06-1.06a.75.75 0 0 1 1.06 0ZM12 17a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 12 17Z"
            fill="currentColor"
          />
        </svg>
      )}
      <span>{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
