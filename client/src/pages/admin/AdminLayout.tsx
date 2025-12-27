import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Building2, 
  DollarSign, 
  Bell, 
  Briefcase, 
  FileText, 
  Image, 
  Settings,
  Home,
  ArrowLeft,
  Menu,
  X,
  Calendar,
  Clock,
  HardHat,
  CreditCard,
  Palette,
  Search,
  Users,
  MousePointer2,
  ShieldCheck,
  HelpCircle,
  MapPin,
  ClipboardCheck,
  Award,
  LayoutGrid,
  Gift,
  FileEdit,
  MessageSquareQuote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import type { User, Booking, Facility } from "@shared/schema";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useAdminPath } from "@/hooks/useAdminPath";

function getNavItems(basePath: string) {
  return [
    { path: basePath, label: "Dashboard", icon: LayoutDashboard },
    { path: `${basePath}/branding`, label: "Branding & Nav", icon: Palette },
    { path: `${basePath}/homepage`, label: "Site Content", icon: Home },
    { path: `${basePath}/coming-soon`, label: "Coming Soon", icon: Clock },
    { path: `${basePath}/venues`, label: "Venues & Locations", icon: MapPin },
    { path: `${basePath}/facilities`, label: "Facilities", icon: Building2 },
    { path: `${basePath}/bookings`, label: "Bookings", icon: CreditCard },
    { path: `${basePath}/members`, label: "Members", icon: Users },
    { path: `${basePath}/membership-applications`, label: "Membership Applications", icon: ClipboardCheck },
    { path: `${basePath}/certifications`, label: "Certifications", icon: Award },
    { path: `${basePath}/comparison-features`, label: "Comparison Features", icon: LayoutGrid },
    { path: `${basePath}/member-benefits`, label: "Member Benefits", icon: Gift },
    { path: `${basePath}/blogs`, label: "Blog / News", icon: FileEdit },
    { path: `${basePath}/testimonials`, label: "Testimonials", icon: MessageSquareQuote },
    { path: `${basePath}/roadmap`, label: "Construction Status", icon: HardHat },
    { path: `${basePath}/events`, label: "Events & Academies", icon: Calendar },
    { path: `${basePath}/pricing`, label: "Pricing Tiers", icon: DollarSign },
    { path: `${basePath}/announcements`, label: "Announcements", icon: Bell },
    { path: `${basePath}/careers`, label: "Careers", icon: Briefcase },
    { path: `${basePath}/rules`, label: "Rules & Safety", icon: FileText },
    { path: `${basePath}/faq`, label: "FAQ", icon: HelpCircle },
    { path: `${basePath}/policies`, label: "Privacy & Terms", icon: ShieldCheck },
    { path: `${basePath}/gallery`, label: "Gallery", icon: Image },
    { path: `${basePath}/site-images`, label: "Site Images", icon: Image },
    { path: `${basePath}/hero-sections`, label: "Hero Sections", icon: Image },
    { path: `${basePath}/ctas`, label: "CTAs", icon: MousePointer2 },
    { path: `${basePath}/site-settings`, label: "Site Settings", icon: Settings },
  ];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { adminPath } = useAdminPath();
  
  useAdminSession();
  
  const basePath = `/${adminPath}`;
  const navItems = useMemo(() => getNavItems(basePath), [basePath]);
  
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: allFacilities } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((path: string) => {
    setSearchOpen(false);
    setLocation(path);
  }, [setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need administrator privileges to access this page.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" /> Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="button-mobile-menu"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#2a4060] flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="font-semibold">Quarterdeck Admin</span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || 
                (item.path !== "/admin" && location.startsWith(item.path));
              
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer
                      ${isActive 
                        ? "bg-[#2a4060] text-white" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-back-to-site">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Site
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold ml-12 lg:ml-0" data-testid="text-admin-title">{title}</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="relative w-full justify-start text-sm text-muted-foreground sm:w-64 lg:w-80"
                onClick={() => setSearchOpen(true)}
                data-testid="button-global-search"
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Search bookings, users, facilities...</span>
                <span className="inline sm:hidden">Search...</span>
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">Ctrl</span>K
                </kbd>
              </Button>
              <span className="text-sm text-muted-foreground hidden md:block">
                {user.firstName} {user.lastName}
              </span>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-medium">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
          <CommandInput placeholder="Search bookings, users, facilities..." data-testid="input-global-search" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Navigation">
              {navItems.map((item) => (
                <CommandItem
                  key={item.path}
                  value={item.label}
                  onSelect={() => handleSelect(item.path)}
                  data-testid={`search-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {allFacilities && allFacilities.length > 0 && (
              <CommandGroup heading="Facilities">
                {allFacilities.slice(0, 5).map((facility) => (
                  <CommandItem
                    key={facility.id}
                    value={`facility ${facility.name} ${facility.slug}`}
                    onSelect={() => handleSelect("/admin/facilities")}
                    data-testid={`search-facility-${facility.id}`}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    {facility.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {allUsers && allUsers.length > 0 && (
              <CommandGroup heading="Users">
                {allUsers.slice(0, 5).map((u) => (
                  <CommandItem
                    key={u.id}
                    value={`user ${u.firstName} ${u.lastName} ${u.email}`}
                    onSelect={() => handleSelect("/admin/bookings")}
                    data-testid={`search-user-${u.id}`}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    {u.firstName} {u.lastName} - {u.email}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {allBookings && allBookings.length > 0 && (
              <CommandGroup heading="Recent Bookings">
                {allBookings.slice(0, 5).map((booking) => {
                  const facility = allFacilities?.find(f => f.id === booking.facilityId);
                  return (
                    <CommandItem
                      key={booking.id}
                      value={`booking ${booking.id} ${facility?.name} ${booking.date}`}
                      onSelect={() => handleSelect("/admin/bookings")}
                      data-testid={`search-booking-${booking.id}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {facility?.name} - {booking.date} at {booking.startTime}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
