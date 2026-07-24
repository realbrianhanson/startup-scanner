import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Emits a single `page_viewed` event whenever the pathname changes.
 * Mount once at the app root; pages must NOT emit their own page-view events.
 */
export default function PageTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}