import { Link, useLocation } from "wouter";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentPage?: string;
}

const routeLabels: Record<string, string> = {
  "": "Home",
  "facilities": "Facilities",
  "events": "Events",
  "roadmap": "Roadmap",
  "gallery": "Gallery",
  "booking": "Book a Facility",
  "leaderboard": "Leaderboard",
  "rules": "Rules & Safety",
  "careers": "Careers",
  "contact": "Contact Us",
  "vision": "Our Vision",
  "privacy": "Privacy Policy",
  "terms": "Terms & Conditions",
  "profile": "My Profile",
};

export function PageBreadcrumb({ items, currentPage }: PageBreadcrumbProps) {
  const [location] = useLocation();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;
    
    const pathSegments = location.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    
    let currentPath = "";
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      
      const isLast = i === pathSegments.length - 1;
      const label = routeLabels[segment] || segment.split("-").map(
        word => word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" ");
      
      breadcrumbs.push({
        label: isLast && currentPage ? currentPage : label,
        href: isLast ? undefined : currentPath,
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  if (breadcrumbItems.length === 0) return null;

  return (
    <Breadcrumb className="mb-4" data-testid="breadcrumb-nav">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbItems.map((item, index) => (
          <span key={index} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
