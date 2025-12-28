import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, ChevronDown, User, Settings, LogOut, BookOpen, MessageSquare, Trophy, HelpCircle, Image, Target, Dumbbell, Crosshair, Building, Calendar, Bell, Eye, Phone, ScrollText, Landmark, Shield, Waves, Gamepad, Music, Mountain, Bike, Sword, Flame, Activity } from "lucide-react";
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
import type { Facility } from "@shared/schema";

interface NavbarProps {
  onScrollTo?: (section: string) => void;
}

interface NavDropdownItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavCategory {
  label: string;
  items: NavDropdownItem[];
}

// Icon mapping for facility icons from database (facility.icon field)
// MAINTAINER NOTE: When adding new facility icons to CMS, add the corresponding
// Lucide icon import above and add the mapping here. Icon names must be lowercase.
// Current facilities use: crosshair, building, target, dumbbell
const iconComponents: Record<string, React.ElementType> = {
  target: Target,
  dumbbell: Dumbbell,
  crosshair: Crosshair,
  building: Building,
  landmark: Landmark,
  shield: Shield,
  waves: Waves,
  gamepad: Gamepad,
  music: Music,
  mountain: Mountain,
  bike: Bike,
  sword: Sword,
  flame: Flame,
  activity: Activity,
  trophy: Trophy,
  calendar: Calendar,
};

// Helper function to get facility icon from database icon field
const getFacilityIcon = (iconName: string | null | undefined): React.ReactNode => {
  const IconComponent = iconComponents[(iconName || 'target').toLowerCase()] || Target;
  return <IconComponent className="w-4 h-4" />;
};

// Helper function to create slug-style test IDs (removes special chars)
const toTestId = (label: string): string => {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
};

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

  const { data: adminConfig } = useQuery<{ adminPath: string }>({
    queryKey: ['/api/admin/config'],
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'),
  });

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ['/api/facilities'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/facilities');
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Build navigation categories
  const navCategories: NavCategory[] = useMemo(() => {
    // Facilities dropdown - dynamic from API (uses facility.icon field from database)
    const facilityItems: NavDropdownItem[] = (facilities || [])
      .filter(f => !f.isHidden)
      .map(f => ({
        label: f.name,
        href: `/facilities/${f.slug}`,
        icon: getFacilityIcon(f.icon),
      }));

    return [
      {
        label: "Facilities",
        items: facilityItems.length > 0 ? facilityItems : [
          { label: "Padel Tennis", href: "/facilities/padel-tennis", icon: <Target className="w-4 h-4" /> },
          { label: "Squash Courts", href: "/facilities/squash", icon: <Dumbbell className="w-4 h-4" /> },
          { label: "Air Rifle Range", href: "/facilities/air-rifle-range", icon: <Crosshair className="w-4 h-4" /> },
          { label: "Multipurpose Hall", href: "/facilities/multipurpose-hall", icon: <Building className="w-4 h-4" /> },
        ],
      },
      {
        label: "Experiences",
        items: [
          { label: "Events & Academies", href: "/events", icon: <Calendar className="w-4 h-4" /> },
          { label: "Leaderboard", href: "/leaderboard", icon: <Trophy className="w-4 h-4" /> },
          { label: "Gallery", href: "/gallery", icon: <Image className="w-4 h-4" /> },
        ],
      },
      {
        label: "Community",
        items: [
          { label: "Blog", href: "/blog", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Testimonials", href: "/testimonials", icon: <MessageSquare className="w-4 h-4" /> },
          { label: "Updates", href: "/updates", icon: <Bell className="w-4 h-4" /> },
        ],
      },
      {
        label: "About",
        items: [
          { label: "Vision", href: "/vision", icon: <Eye className="w-4 h-4" /> },
          { label: "Contact", href: "/contact", icon: <Phone className="w-4 h-4" /> },
          { label: "FAQ", href: "/faq", icon: <HelpCircle className="w-4 h-4" /> },
          { label: "Club Rules", href: "/rules", icon: <ScrollText className="w-4 h-4" /> },
        ],
      },
    ];
  }, [facilities]);

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

          <div className="hidden lg:flex items-center gap-6 text-sm text-primary-foreground/70">
            {navCategories.map((category) => (
              <DropdownMenu key={category.label}>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center gap-1 hover:text-primary-foreground transition-colors cursor-pointer" 
                    data-testid={`button-nav-${toTestId(category.label)}`}
                  >
                    {category.label} <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {category.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <DropdownMenuItem 
                        className="cursor-pointer gap-2" 
                        data-testid={`menu-item-${toTestId(item.label)}`}
                      >
                        {item.icon}
                        {item.label}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
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
            {navCategories.map((category, idx) => (
              <div key={category.label} className={idx > 0 ? "border-t border-primary-foreground/10 pt-3 mt-2" : ""}>
                <span className="text-xs text-primary-foreground/50 uppercase tracking-wider" data-testid={`text-mobile-category-${toTestId(category.label)}`}>{category.label}</span>
                <div className="flex flex-col gap-1 mt-2">
                  {category.items.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <span 
                        className="flex items-center gap-2 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground cursor-pointer"
                        data-testid={`link-mobile-${toTestId(item.label)}`}
                      >
                        {item.icon} {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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
