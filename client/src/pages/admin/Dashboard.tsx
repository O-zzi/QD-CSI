import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Calendar, Bell, Briefcase, FileText, Image, DollarSign } from "lucide-react";
import type { Facility, Announcement, GalleryImage, PricingTier, Career, Rule } from "@shared/schema";

export default function AdminDashboard() {
  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
  });

  const { data: gallery } = useQuery<GalleryImage[]>({
    queryKey: ["/api/admin/gallery"],
  });

  const { data: pricingTiers } = useQuery<PricingTier[]>({
    queryKey: ["/api/admin/pricing-tiers"],
  });

  const { data: careers } = useQuery<Career[]>({
    queryKey: ["/api/admin/careers"],
  });

  const { data: rules } = useQuery<Rule[]>({
    queryKey: ["/api/admin/rules"],
  });

  const stats = [
    { 
      label: "Facilities", 
      value: facilities?.length || 0, 
      icon: Building2,
      color: "text-blue-500"
    },
    { 
      label: "Pricing Tiers", 
      value: pricingTiers?.length || 0, 
      icon: DollarSign,
      color: "text-green-500"
    },
    { 
      label: "Announcements", 
      value: announcements?.length || 0, 
      icon: Bell,
      color: "text-amber-500"
    },
    { 
      label: "Career Listings", 
      value: careers?.length || 0, 
      icon: Briefcase,
      color: "text-purple-500"
    },
    { 
      label: "Rules & Policies", 
      value: rules?.length || 0, 
      icon: FileText,
      color: "text-red-500"
    },
    { 
      label: "Gallery Images", 
      value: gallery?.length || 0, 
      icon: Image,
      color: "text-indigo-500"
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the sidebar to navigate to different sections and manage content for The Quarterdeck website.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
