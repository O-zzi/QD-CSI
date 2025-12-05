import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onScrollTo?: (section: string) => void;
}

interface NavLink {
  label: string;
  section?: string;
  href?: string;
  children?: { label: string; href: string }[];
}

export function Navbar({ onScrollTo }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

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

  const navLinks: NavLink[] = [
    { label: "Home", section: "hero" },
    { label: "About", href: "/vision" },
    { label: "Facilities", href: "/facilities" },
    { label: "Updates", href: "/roadmap" },
    { label: "Gallery", section: "gallery" },
    { label: "Membership", section: "membership" },
    { label: "Contact", section: "contact" },
  ];

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
              <div className="qd-logo-mark">Q</div>
              <div>
                <div className="font-bold tracking-wider text-sm uppercase">The Quarterdeck</div>
                <div className="text-xs text-muted-foreground">Sports & Recreation Complex</div>
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
