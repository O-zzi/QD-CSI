import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      size="icon"
      variant="outline"
      className={`fixed bottom-6 right-20 z-50 rounded-full shadow-lg transition-all duration-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-border ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      data-testid="button-scroll-to-top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}
