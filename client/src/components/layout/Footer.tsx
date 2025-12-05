import { Link } from "wouter";
import { Instagram, Facebook, Linkedin, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import footerBg from "@assets/stock_images/dark_elegant_sports__61a0b4ec.jpg";

export function Footer() {
  const { data: siteSettings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    staleTime: 1000 * 60 * 5,
  });

  const getSetting = (key: string, fallback: string = "") => {
    return siteSettings?.[key] || fallback;
  };

  const siteName = getSetting("site_name", "The Quarterdeck");
  const siteTagline = getSetting("site_tagline", "Sports & Recreation Complex");
  const instagramUrl = getSetting("instagram_url") || getSetting("social_instagram", "#");
  const facebookUrl = getSetting("facebook_url") || getSetting("social_facebook", "#");
  const linkedinUrl = getSetting("linkedin_url") || getSetting("social_linkedin", "#");
  const copyrightYear = new Date().getFullYear();

  return (
    <footer className="qd-footer relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${footerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/95 to-[#111827]/80" />
      <div className="qd-container relative z-10">
        <div className="flex flex-wrap justify-between gap-6 items-center">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-footer-logo">
              <div className="qd-logo-mark">{siteName.charAt(0)}</div>
              <div>
                <div className="font-bold tracking-wider text-sm uppercase text-gray-200">{siteName}</div>
                <div className="text-xs text-gray-400">{siteTagline}</div>
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap gap-4">
            <Link href="/vision">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" data-testid="link-footer-about">
                About Us
              </span>
            </Link>
            <Link href="/facilities">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" data-testid="link-footer-facilities">
                Facilities
              </span>
            </Link>
            <Link href="/rules">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" data-testid="link-footer-rules">
                Rules & Safety
              </span>
            </Link>
            <Link href="/careers">
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer" data-testid="link-footer-careers">
                Careers
              </span>
            </Link>
          </div>

          <div className="flex gap-4">
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
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qd-social-icon"
              aria-label="LinkedIn"
              data-testid="link-social-linkedin"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        <p className="text-center mt-6 text-gray-500 text-xs">
          © {copyrightYear} {siteName} – All rights reserved.{" "}
          <Link href="/terms" className="font-semibold hover:text-gray-300 cursor-pointer" data-testid="link-footer-terms">
            Terms & Conditions
          </Link>
          {" | "}
          <Link href="/privacy" className="font-semibold hover:text-gray-300 cursor-pointer" data-testid="link-footer-privacy">
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}
