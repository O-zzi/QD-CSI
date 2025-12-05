import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavbarItem, SiteSetting } from "@shared/schema";

interface NavbarProps {
  onScrollTo?: (section: string) => void;
}

interface NavLink {
  label: string;
  section?: string;
  href?: string;
  children?: { label: string; href: string }[];
}

const defaultNavLinks: NavLink[] = [
  { label: "Facilities", href: "/facilities" },
  { label: "Events & Academies", href: "/events" },
  { label: "Updates", href: "/roadmap" },
  { label: "Gallery", section: "gallery" },
  { label: "Contact", section: "contact" },
];

export function Navbar({ onScrollTo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const { data: siteSettings } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
  });

  const { data: navbarItems } = useQuery<NavbarItem[]>({
    queryKey: ['/api/navbar-items'],
  });

  const scrollToSection = (id: string) => {
    if (location !== "/") {
      window.location.href = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const getSetting = (key: string, fallback: string = "") => {
    if (Array.isArray(siteSettings)) {
      return siteSettings.find(s => s.key === key)?.value || fallback;
    }
    return (siteSettings as any)?.[key] || fallback;
  };

  const logoUrl = getSetting("logo_main_url");
  const siteName = getSetting("site_name", "The Quarterdeck");
  const siteTagline = getSetting("site_tagline", "Sports & Recreation Complex");

  const navLinks: NavLink[] = useMemo(() => {
    if (!navbarItems || navbarItems.length === 0) {
      return defaultNavLinks;
    }
    return navbarItems
      .filter(item => item.isVisible)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(item => {
        if (item.href?.startsWith('/#')) {
          return { label: item.label, section: item.href.replace('/#', '') };
        }
        return { label: item.label, href: item.href };
      });
  }, [navbarItems]);

  const handleNavClick = (link: NavLink) => {
    if (link.href) {
      setMobileMenuOpen(false);
      window.location.href = link.href;
    } else if (link.section) {
      scrollToSection(link.section);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-gray-200/90 dark:border-slate-700/90">
      <div className="qd-container">
        <nav className="h-[70px] flex items-center justify-between gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-logo">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteName} 
                  className="h-10 w-auto object-contain"
                  data-testid="img-site-logo"
                />
              ) : (
                <div className="qd-logo-mark">Q</div>
              )}
              <div>
                <div className="font-bold tracking-wider text-sm uppercase">{siteName}</div>
                <div className="text-xs text-muted-foreground">{siteTagline}</div>
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              link.href ? (
                <Link key={link.label} href={link.href}>
                  <span className="qd-nav-link cursor-pointer" data-testid={`link-nav-${link.label.toLowerCase()}`}>
                    {link.label}
                  </span>
                </Link>
              ) : (
                <button
                  key={link.section}
                  onClick={() => scrollToSection(link.section!)}
                  className="qd-nav-link"
                  data-testid={`link-nav-${link.section}`}
                >
                  {link.label}
                </button>
              )
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link href="/booking">
                  <Button className="rounded-full" data-testid="button-book-now">
                    Book Now
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="rounded-full" data-testid="button-profile">
                    {user?.firstName || "Profile"}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <a href="/api/login">
                  <Button variant="outline" className="rounded-full" data-testid="button-login">
                    Log In
                  </Button>
                </a>
                <Link href="/booking">
                  <Button className="rounded-full" data-testid="button-book-now">
                    Book Now
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden flex flex-col gap-2 pb-4 border-t border-gray-100 dark:border-slate-700 pt-4 animate-qd-fade-in">
            {navLinks.map((link) => (
              link.href ? (
                <Link key={link.label} href={link.href}>
                  <span 
                    className="block text-left py-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ) : (
                <button
                  key={link.section}
                  onClick={() => handleNavClick(link)}
                  className="text-left py-2 text-sm text-muted-foreground hover:text-foreground"
                  data-testid={`link-mobile-nav-${link.section}`}
                >
                  {link.label}
                </button>
              )
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-700 pt-4 mt-4">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {isAuthenticated ? (
                <>
                  <Link href="/booking">
                    <Button className="w-full rounded-full" data-testid="button-mobile-book">
                      Book Now
                    </Button>
                  </Link>
                  <a href="/api/logout">
                    <Button variant="outline" className="w-full rounded-full" data-testid="button-mobile-logout">
                      Log Out
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <a href="/api/login">
                    <Button className="w-full rounded-full" data-testid="button-mobile-login">
                      Log In
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
