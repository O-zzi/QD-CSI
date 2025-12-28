import { Link } from "wouter";
import { Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import footerBgDefault from "@assets/stock_images/dark_elegant_sports__61a0b4ec.jpg";
import type { SiteImage } from "@shared/schema";

export function Footer() {
  const { data: siteSettings, isLoading } = useQuery<Record<string, string>>({
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
    staleTime: 1000 * 60 * 5,
  });

  const { data: siteImages = [] } = useQuery<SiteImage[]>({
    queryKey: ['/api/site-images', 'global'],
    queryFn: async () => {
      const res = await fetch('/api/site-images?page=global');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const footerBg = useMemo(() => {
    if (!Array.isArray(siteImages)) return footerBgDefault;
    const img = siteImages.find(img => img.section === 'footer' && img.isActive);
    return img?.imageUrl || footerBgDefault;
  }, [siteImages]);

  const getSetting = (key: string, fallback: string = "") => {
    return siteSettings?.[key] || fallback;
  };

  const siteName = getSetting("site_name", "The Quarterdeck");
  const siteTagline = getSetting("site_tagline", "Sports & Recreation Complex");
  const instagramUrl = getSetting("instagram_url") || getSetting("social_instagram", "#");
  const facebookUrl = getSetting("facebook_url") || getSetting("social_facebook", "#");
  const twitterUrl = getSetting("twitter_url") || getSetting("social_twitter", "#");
  const youtubeUrl = getSetting("youtube_url") || getSetting("social_youtube", "#");
  const copyrightYear = new Date().getFullYear();

  return (
    <footer className="qd-footer relative overflow-hidden bg-primary dark:bg-slate-900">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 dark:opacity-20"
        style={{ backgroundImage: `url(${footerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/95 to-primary/80 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/80" />
      <div className="qd-container relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-footer-logo">
              <div className="qd-logo-mark">{siteName.charAt(0)}</div>
              <div>
                <div className="font-bold tracking-wider text-sm uppercase text-primary-foreground">{siteName}</div>
                <div className="text-xs text-primary-foreground/70">{siteTagline}</div>
              </div>
            </div>
          </Link>

          {/* Center: Links + Copyright */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/terms">
                <span className="text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer" data-testid="link-footer-terms">
                  Terms
                </span>
              </Link>
              <Link href="/privacy">
                <span className="text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer" data-testid="link-footer-privacy">
                  Privacy
                </span>
              </Link>
              <Link href="/careers">
                <span className="text-primary-foreground/70 hover:text-primary-foreground transition-colors cursor-pointer" data-testid="link-footer-careers">
                  Careers
                </span>
              </Link>
            </div>
            <p className="text-primary-foreground/60 text-xs">
              © {copyrightYear} {siteName} – All rights reserved.
            </p>
          </div>

          {/* Right: Social Icons */}
          <div className="flex gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qd-social-icon"
              aria-label="Instagram"
              data-testid="link-social-instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qd-social-icon"
              aria-label="Facebook"
              data-testid="link-social-facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qd-social-icon"
              aria-label="X (Twitter)"
              data-testid="link-social-twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qd-social-icon"
              aria-label="YouTube"
              data-testid="link-social-youtube"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
