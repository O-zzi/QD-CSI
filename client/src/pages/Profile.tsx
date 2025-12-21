import { useState, useMemo, useRef } from "react";
import { Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { formatPKR } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, User, Mail, Calendar, Award, 
  Clock, CreditCard, Shield, FileCheck, Users, Bell, Check, Trash2, History, CalendarDays, Camera, Loader2
} from "lucide-react";
import type { Booking, Membership, Notification } from "@shared/schema";

export default function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const defaultTab = urlParams.get('tab') || 'account';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: membership } = useQuery<Membership>({
    queryKey: ['/api/memberships/my'],
    enabled: isAuthenticated,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings/my'],
    enabled: isAuthenticated,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const photoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/user/profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload photo');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Photo updated", description: "Your profile photo has been updated successfully." });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
        return;
      }
      photoUploadMutation.mutate(file);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const upcoming = bookings.filter(b => b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const past = bookings.filter(b => b.date < today).sort((a, b) => b.date.localeCompare(a.date));
    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings, today]);

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

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
            <Link href="/login">
              <Button className="w-full" data-testid="button-login-prompt">
                Sign In
              </Button>
            </Link>
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-blue-500';
      case 'payment': return 'bg-green-500';
      case 'membership': return 'bg-purple-500';
      case 'event': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const renderBookingItem = (booking: Booking) => (
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
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
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

      <div className="qd-container py-6">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="account" data-testid="tab-account">
              <User className="w-4 h-4 mr-2 hidden sm:inline" />
              Account
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">
              <Calendar className="w-4 h-4 mr-2 hidden sm:inline" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="relative" data-testid="tab-notifications">
              <Bell className="w-4 h-4 mr-2 hidden sm:inline" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-medium text-white bg-red-500 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="membership" data-testid="tab-membership">
              <Award className="w-4 h-4 mr-2 hidden sm:inline" />
              Membership
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative group">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      disabled={photoUploadMutation.isPending}
                      data-testid="button-change-photo"
                    >
                      {photoUploadMutation.isPending ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      data-testid="input-profile-photo"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">Click on photo to change</p>
                  </div>
                </div>
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

            <div className="text-center">
              <a href="/api/logout">
                <Button variant="outline" className="rounded-full" data-testid="button-logout">
                  Sign Out
                </Button>
              </a>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Bookings</h2>
              <Link href="/booking">
                <Button size="sm" data-testid="button-new-booking">
                  New Booking
                </Button>
              </Link>
            </div>

            <Tabs defaultValue="upcoming" className="space-y-4">
              <TabsList>
                <TabsTrigger value="upcoming" className="gap-2" data-testid="tab-upcoming-bookings">
                  <CalendarDays className="w-4 h-4" />
                  Upcoming ({upcomingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="past" className="gap-2" data-testid="tab-past-bookings">
                  <History className="w-4 h-4" />
                  Past ({pastBookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-3">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map(renderBookingItem)
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">No upcoming bookings</p>
                      <Link href="/booking">
                        <Button data-testid="button-make-first-booking">Book a Facility</Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-3">
                {pastBookings.length > 0 ? (
                  pastBookings.map(renderBookingItem)
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No past bookings</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadNotifications > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  data-testid="button-mark-all-notifications-read"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark all read
                </Button>
              )}
            </div>

            {notificationsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={notification.isRead ? '' : 'ring-1 ring-primary/20'}
                    data-testid={`notification-card-${notification.id}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getNotificationColor(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {notification.link ? (
                                <Link href={notification.link}>
                                  <p className="font-semibold hover:underline cursor-pointer">{notification.title}</p>
                                </Link>
                              ) : (
                                <p className="font-semibold">{notification.title}</p>
                              )}
                              <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => markReadMutation.mutate(notification.id)}
                                  disabled={markReadMutation.isPending}
                                  data-testid={`button-mark-notification-read-${notification.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-destructive"
                                onClick={() => deleteMutation.mutate(notification.id)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-notification-${notification.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="membership" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
