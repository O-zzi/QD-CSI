import { useEffect } from "react";
import { useLocation } from "wouter";

export function RouteScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    if (!location.includes('#')) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location]);

  return null;
}
