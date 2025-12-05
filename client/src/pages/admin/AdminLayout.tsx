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
  HardHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { User } from "@shared/schema";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/homepage", label: "Site Content", icon: Home },
  { path: "/admin/coming-soon", label: "Coming Soon", icon: Clock },
  { path: "/admin/facilities", label: "Facilities", icon: Building2 },
  { path: "/admin/roadmap", label: "Construction Status", icon: HardHat },
  { path: "/admin/events", label: "Events & Academies", icon: Calendar },
  { path: "/admin/pricing", label: "Pricing Tiers", icon: DollarSign },
  { path: "/admin/announcements", label: "Announcements", icon: Bell },
  { path: "/admin/careers", label: "Careers", icon: Briefcase },
  { path: "/admin/rules", label: "Rules & Policies", icon: FileText },
  { path: "/admin/gallery", label: "Gallery", icon: Image },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold ml-12 lg:ml-0" data-testid="text-admin-title">{title}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
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

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
