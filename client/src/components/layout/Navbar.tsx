import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, ChevronDown, User, Settings, LogOut, MoreHorizontal, BookOpen, MessageSquare, Trophy, HelpCircle, Image } from "lucide-react";
import footerBg from "@assets/stock_images/dark_elegant_sports__61a0b4ec.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavbarItem } from "@shared/schema";

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
  { label: "Updates", href: "/updates" },
  { label: "Contact", href: "/contact" },
];

export function Navbar({ onScrollTo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ['/api/site-settings'],
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
  });

  const { data: navbarItems } = useQuery<NavbarItem[]>({
    queryKey: ['/api/navbar-items'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/navbar-items');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const { data: adminConfig } = useQuery<{ adminPath: string }>({
    queryKey: ['/api/admin/config'],
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (location !== "/") {
      // Navigate to home page first, then scroll after navigation
      setLocation("/");
      // Store the target section in sessionStorage for the home page to handle
      sessionStorage.setItem('scrollToSection', id);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -80;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };
  
  // Handle scroll-to-section from other pages
  useEffect(() => {
    if (location === "/") {
      const sectionId = sessionStorage.getItem('scrollToSection');
      if (sectionId) {
        sessionStorage.removeItem('scrollToSection');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            const yOffset = -80;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 100);
      }
    }
  }, [location]);

  const getSetting = (key: string, fallback: string = "") => {
    return siteSettings?.[key] || fallback;
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
        // Gallery and Contact should always go to their pages
        if (item.href === '/#gallery') {
          return { label: item.label, href: '/gallery' };
        }
        if (item.href === '/#contact') {
          return { label: item.label, href: '/contact' };
        }
        if (item.href?.startsWith('/#')) {
          return { label: item.label, section: item.href.replace('/#', '') };
        }
        return { label: item.label, href: item.href };
      });
  }, [navbarItems]);

  const handleNavClick = (link: NavLink) => {
    if (link.href) {
      setMobileMenuOpen(false);
      setLocation(link.href);
    } else if (link.section) {
      scrollToSection(link.section);
    }
  };

  return (
    <header className="sticky top-0 z-50 relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 dark:opacity-25"
        style={{ backgroundImage: `url(${footerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/95 to-primary dark:from-slate-900/90 dark:via-slate-900/95 dark:to-slate-900" />
      <div className="qd-container relative z-10">
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
                <div className="font-bold tracking-wider text-sm uppercase text-primary-foreground">{siteName}</div>
                <div className="text-xs text-primary-foreground/70">{siteTagline}</div>
              </div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7 text-sm text-primary-foreground/70">
            {navLinks.map((link) => (
              link.href ? (
                <Link key={link.label} href={link.href}>
                  <span className="hover:text-primary-foreground transition-colors cursor-pointer" data-testid={`link-nav-${link.label.toLowerCase()}`}>
                    {link.label}
                  </span>
                </Link>
              ) : (
                <button
                  key={link.section}
                  onClick={() => scrollToSection(link.section!)}
                  className="hover:text-primary-foreground transition-colors"
                  data-testid={`link-nav-${link.section}`}
                >
                  {link.label}
                </button>
              )
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 hover:text-primary-foreground transition-colors cursor-pointer" data-testid="button-nav-more">
                  More <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <Link href="/blog">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-blog">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Blog
                  </DropdownMenuItem>
                </Link>
                <Link href="/testimonials">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-testimonials">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Testimonials
                  </DropdownMenuItem>
                </Link>
                <Link href="/leaderboard">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-leaderboard">
                    <Trophy className="w-4 h-4 mr-2" />
                    Leaderboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/gallery">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-gallery">
                    <Image className="w-4 h-4 mr-2" />
                    Gallery
                  </DropdownMenuItem>
                </Link>
                <Link href="/faq">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-faq">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    FAQ
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Link href="/booking">
                  <Button className="rounded-full" data-testid="button-book-now">
                    Book Now
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full gap-2" data-testid="button-user-menu">
                      <User className="w-4 h-4" />
                      {user?.firstName || "Account"}
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-profile">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </DropdownMenuItem>
                    </Link>
                    {isAdmin && adminConfig?.adminPath && (
                      <>
                        <DropdownMenuSeparator />
                        <Link href={`/${adminConfig.adminPath}`}>
                          <DropdownMenuItem className="cursor-pointer" data-testid="menu-item-admin">
                            <Settings className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <a href="/api/logout">
                      <DropdownMenuItem className="cursor-pointer text-destructive" data-testid="menu-item-logout">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </DropdownMenuItem>
                    </a>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="rounded-full" data-testid="button-login">
                    Log In
                  </Button>
                </Link>
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
            {mobileMenuOpen ? <X className="w-5 h-5 text-primary-foreground" /> : <Menu className="w-5 h-5 text-primary-foreground" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden flex flex-col gap-2 pb-4 border-t border-primary-foreground/10 pt-4 animate-qd-fade-in">
            {navLinks.map((link) => (
              link.href ? (
                <Link key={link.label} href={link.href}>
                  <span 
                    className="block text-left py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer"
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
                  className="text-left py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground"
                  data-testid={`link-mobile-nav-${link.section}`}
                >
                  {link.label}
                </button>
              )
            ))}
            <div className="border-t border-primary-foreground/10 pt-3 mt-2">
              <span className="text-xs text-primary-foreground/50 uppercase tracking-wider">More</span>
              <div className="flex flex-col gap-1 mt-2">
                <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer" data-testid="link-mobile-blog">
                    <BookOpen className="w-4 h-4" /> Blog
                  </span>
                </Link>
                <Link href="/testimonials" onClick={() => setMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer" data-testid="link-mobile-testimonials">
                    <MessageSquare className="w-4 h-4" /> Testimonials
                  </span>
                </Link>
                <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer" data-testid="link-mobile-leaderboard">
                    <Trophy className="w-4 h-4" /> Leaderboard
                  </span>
                </Link>
                <Link href="/gallery" onClick={() => setMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer" data-testid="link-mobile-gallery">
                    <Image className="w-4 h-4" /> Gallery
                  </span>
                </Link>
                <Link href="/faq" onClick={() => setMobileMenuOpen(false)}>
                  <span className="flex items-center gap-2 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer" data-testid="link-mobile-faq">
                    <HelpCircle className="w-4 h-4" /> FAQ
                  </span>
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-primary-foreground/10 pt-4 mt-4">
              <span className="text-sm text-primary-foreground/70">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {isAuthenticated ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full gap-2" data-testid="button-mobile-profile">
                      <User className="w-4 h-4" />
                      My Profile
                    </Button>
                  </Link>
                  {isAdmin && adminConfig?.adminPath && (
                    <Link href={`/${adminConfig.adminPath}`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full gap-2" data-testid="button-mobile-admin">
                        <Settings className="w-4 h-4" />
                        Admin Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link href="/booking" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full" data-testid="button-mobile-book">
                      Book Now
                    </Button>
                  </Link>
                  <a href="/api/logout">
                    <Button variant="outline" className="w-full rounded-full gap-2 text-destructive" data-testid="button-mobile-logout">
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="w-full rounded-full" data-testid="button-mobile-login">
                      Log In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
