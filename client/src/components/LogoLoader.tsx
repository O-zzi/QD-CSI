import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface LogoLoaderProps {
  onLoaded: () => void;
  minDisplayTime?: number;
}

export function LogoLoader({ onLoaded, minDisplayTime = 800 }: LogoLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return {};
        const data = await res.json();
        return data && typeof data === 'object' && !data.message ? data : {};
      } catch {
        return {};
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const logoUrl = settings?.logo_main_url;
  const siteName = settings?.site_name || "The Quarterdeck";

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / minDisplayTime) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        clearInterval(interval);
        setIsFading(true);
        setTimeout(() => {
          onLoaded();
        }, 400);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [minDisplayTime, onLoaded]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      data-testid="logo-loader"
    >
      <div className="flex flex-col items-center gap-6">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={siteName}
            className="h-16 w-auto animate-pulse"
            data-testid="img-loader-logo"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2a4060] to-[#1f2937] flex items-center justify-center animate-pulse">
            <span className="text-2xl font-bold text-white">Q</span>
          </div>
        )}
        
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
            data-testid="loader-progress-bar"
          />
        </div>
        
        <p className="text-sm text-muted-foreground animate-pulse" data-testid="text-loader-status">
          Loading...
        </p>
      </div>
    </div>
  );
}
