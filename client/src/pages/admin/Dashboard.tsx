import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Building2, Users, Calendar, Bell, Briefcase, FileText, Image, DollarSign,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Eye, ChevronRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Facility, Announcement, GalleryImage, PricingTier, Career, Rule, Booking, User } from "@shared/schema";
import { format } from "date-fns";

const PAYMENT_COLORS = {
  VERIFIED: "#22c55e",
  PENDING_VERIFICATION: "#eab308",
  PENDING_PAYMENT: "#6b7280",
  REJECTED: "#ef4444",
};

const BOOKING_COLORS = {
  CONFIRMED: "#22c55e",
  PENDING: "#3b82f6",
  CANCELLED: "#ef4444",
};

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

  const { data: bookings } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const pendingVerificationCount = bookings?.filter(b => b.paymentStatus === "PENDING_VERIFICATION").length || 0;
  const confirmedBookings = bookings?.filter(b => b.status === "CONFIRMED").length || 0;
  const totalRevenue = bookings?.filter(b => b.paymentStatus === "VERIFIED").reduce((sum, b) => sum + (b.totalPrice || 0), 0) || 0;

  const paymentStatusData = [
    { name: "Verified", value: bookings?.filter(b => b.paymentStatus === "VERIFIED").length || 0, color: PAYMENT_COLORS.VERIFIED },
    { name: "Pending Verification", value: bookings?.filter(b => b.paymentStatus === "PENDING_VERIFICATION").length || 0, color: PAYMENT_COLORS.PENDING_VERIFICATION },
    { name: "Awaiting Payment", value: bookings?.filter(b => b.paymentStatus === "PENDING_PAYMENT").length || 0, color: PAYMENT_COLORS.PENDING_PAYMENT },
    { name: "Rejected", value: bookings?.filter(b => b.paymentStatus === "REJECTED").length || 0, color: PAYMENT_COLORS.REJECTED },
  ].filter(item => item.value > 0);

  const facilityBookingData = facilities?.map(facility => ({
    name: facility.name.length > 15 ? facility.name.slice(0, 12) + "..." : facility.name,
    fullName: facility.name,
    bookings: bookings?.filter(b => b.facilityId === facility.id).length || 0,
    revenue: bookings?.filter(b => b.facilityId === facility.id && b.paymentStatus === "VERIFIED")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0) || 0,
  })) || [];

  const recentBookings = bookings?.slice()
    .sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`);
      const dateB = new Date(`${b.date} ${b.startTime}`);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5) || [];

  const stats = [
    { 
      label: "Total Bookings", 
      value: bookings?.length || 0, 
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      trend: `${confirmedBookings} confirmed`
    },
    { 
      label: "Pending Verification", 
      value: pendingVerificationCount, 
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      trend: pendingVerificationCount > 0 ? "Action needed" : "All clear"
    },
    { 
      label: "Verified Revenue", 
      value: `PKR ${totalRevenue.toLocaleString()}`, 
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      trend: `${bookings?.filter(b => b.paymentStatus === "VERIFIED").length || 0} payments`
    },
    { 
      label: "Total Users", 
      value: users?.length || 0, 
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      trend: `${users?.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length || 0} admins`
    },
  ];

  const contentStats = [
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

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-green-600">Verified</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge className="bg-amber-500">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Awaiting</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string | null, paymentStatus: string | null) => {
    if (status === "CONFIRMED" && paymentStatus === "VERIFIED") {
      return <Badge className="bg-green-600">Confirmed</Badge>;
    }
    if (status === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    return <Badge variant="secondary">Tentative</Badge>;
  };

  const getFacilityName = (facilityId: string | null) => {
    if (!facilityId || !facilities) return "Unknown";
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name || "Unknown";
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {pendingVerificationCount > 0 && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-900/20" data-testid="alert-pending-verification">
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-amber-800 dark:text-amber-200">
                  {pendingVerificationCount} booking{pendingVerificationCount > 1 ? 's' : ''} pending payment verification
                </span>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Review and verify payments to confirm bookings.
                </p>
              </div>
              <Link href="/admin/bookings">
                <Button size="sm" variant="outline" data-testid="button-view-pending">
                  View Pending <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {stat.trend}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bookings by Facility</CardTitle>
              <CardDescription>Total bookings and revenue per facility</CardDescription>
            </CardHeader>
            <CardContent>
              {facilityBookingData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facilityBookingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? `PKR ${value.toLocaleString()}` : value,
                          name === "revenue" ? "Revenue" : "Bookings"
                        ]}
                        labelFormatter={(label: string) => {
                          const item = facilityBookingData.find(f => f.name === label);
                          return item?.fullName || label;
                        }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No booking data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Status Distribution</CardTitle>
              <CardDescription>Overview of payment statuses across all bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentStatusData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, "Bookings"]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </div>
            <Link href="/admin/bookings">
              <Button variant="outline" size="sm" data-testid="button-view-all-bookings">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Date / Time</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.map((booking) => (
                      <TableRow key={booking.id} data-testid={`row-recent-booking-${booking.id}`}>
                        <TableCell className="font-mono text-xs">
                          {booking.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{booking.date}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{getFacilityName(booking.facilityId)}</div>
                          <div className="text-xs text-muted-foreground">
                            Resource #{booking.resourceId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            PKR {booking.totalPrice?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          {getBookingStatusBadge(booking.status, booking.paymentStatus)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bookings yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Content Overview</CardTitle>
            <CardDescription>Quick stats on website content managed through the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {contentStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center p-4 rounded-lg bg-muted/50" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
