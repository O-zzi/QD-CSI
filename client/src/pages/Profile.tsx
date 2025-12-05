import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatPKR } from "@/lib/authUtils";
import { 
  ArrowLeft, User, Mail, Phone, Calendar, Award, 
  Clock, CreditCard, Shield, FileCheck, Users
} from "lucide-react";
import type { Booking, Membership } from "@shared/schema";

export default function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const { data: membership } = useQuery<Membership>({
    queryKey: ['/api/memberships/my'],
    enabled: isAuthenticated,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings/my'],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="qd-container py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to view your profile and booking history.
            </p>
            <a href="/api/login">
              <Button className="w-full" data-testid="button-login-prompt">
                Sign In with Replit
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    FOUNDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    GOLD: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    SILVER: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    GUEST: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="qd-container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold" data-testid="text-profile-title">Member Profile</h1>
              <p className="text-xs text-muted-foreground">Manage your account and view booking history</p>
            </div>
            {membership && (
              <Badge className={tierColors[membership.tier] || tierColors.GUEST}>
                {membership.tier} Member
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="qd-container py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <User className="w-3 h-3" /> Name
                  </div>
                  <p className="font-semibold" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Mail className="w-3 h-3" /> Email
                  </div>
                  <p className="font-semibold text-sm truncate" data-testid="text-user-email">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CreditCard className="w-3 h-3" /> Credit Balance
                  </div>
                  <p className="font-semibold text-sky-600" data-testid="text-credit-balance">
                    {formatPKR(user?.creditBalance || 0)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" /> Total Hours Played
                  </div>
                  <p className="font-semibold" data-testid="text-hours-played">
                    {user?.totalHoursPlayed || 0} hrs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Shield className="w-3 h-3" /> Safety Certified
                  </div>
                  <p className={`font-semibold ${user?.isSafetyCertified ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.isSafetyCertified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <FileCheck className="w-3 h-3" /> Waiver Signed
                  </div>
                  <p className={`font-semibold ${user?.hasSignedWaiver ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.hasSignedWaiver ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Membership Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Membership Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {membership ? (
                <>
                  <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 rounded-xl text-white">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs uppercase tracking-wider opacity-70">Member ID</span>
                      <span className="font-mono font-bold" data-testid="text-membership-number">
                        {membership.membershipNumber}
                      </span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{membership.tier} Tier</div>
                    <div className="text-xs opacity-70">
                      Valid until: {new Date(membership.validTo).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Status</div>
                      <Badge variant={membership.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {membership.status}
                      </Badge>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Users className="w-3 h-3" /> Guest Passes
                      </div>
                      <p className="font-semibold">{membership.guestPasses} remaining</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No active membership</p>
                  <Link href="/#membership">
                    <Button variant="outline" data-testid="button-view-membership-options">
                      View Membership Options
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking History */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking History
                </span>
                <Link href="/booking">
                  <Button size="sm" data-testid="button-new-booking">
                    New Booking
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl"
                      data-testid={`booking-entry-${booking.id}`}
                    >
                      <div>
                        <div className="font-semibold">{booking.venue}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.date} at {booking.startTime} - {booking.endTime}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                        <div className="text-sm font-semibold text-sky-600 mt-1">
                          {formatPKR(booking.totalPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No bookings yet</p>
                  <Link href="/booking">
                    <Button data-testid="button-make-first-booking">Make Your First Booking</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <a href="/api/logout">
            <Button variant="outline" className="rounded-full" data-testid="button-logout">
              Sign Out
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
