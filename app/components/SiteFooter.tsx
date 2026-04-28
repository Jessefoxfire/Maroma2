"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="site-footer" aria-label="Site">
      <div className="site-footer-actions" aria-label="Account">
        <button className="icon-button" type="button" aria-label="Login">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 12.2c2.1 0 3.8-1.8 3.8-4s-1.7-4-3.8-4-3.8 1.8-3.8 4 1.7 4 3.8 4Zm0 2.2c-3 0-5.7 1.6-7 4.1-.3.6.1 1.3.8 1.3h12.3c.7 0 1.2-.7.8-1.3-1.3-2.5-4-4.1-7-4.1Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </footer>
  );
}
