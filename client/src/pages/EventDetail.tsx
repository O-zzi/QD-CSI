import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, Users, Clock, Trophy, MapPin, User, 
  Check, Loader2, LogIn, ArrowLeft, Share2, 
  DollarSign, CalendarDays, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";

const registrationFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  guestCount: z.number().min(0).max(10).default(0),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

const eventTypeColors: Record<string, string> = {
  TOURNAMENT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  CLASS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  ACADEMY: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  SOCIAL: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
  WORKSHOP: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
};

const eventTypeLabels: Record<string, string> = {
  TOURNAMENT: 'Tournament',
  CLASS: 'Class',
  ACADEMY: 'Academy',
  SOCIAL: 'Social Event',
  WORKSHOP: 'Workshop',
};

export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      guestCount: 0,
      notes: "",
    },
  });

  const { data: event, isLoading } = useQuery<Event>({
    queryKey: ['/api/events', slug],
    queryFn: async () => {
      const res = await fetch(`/api/events/${slug}`);
      if (!res.ok) throw new Error('Event not found');
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: userRegistrations = [] } = useQuery<{ eventId: string }[]>({
    queryKey: ['/api/user/event-registrations'],
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      form.setValue('fullName', `${user.firstName || ''} ${user.lastName || ''}`.trim());
      form.setValue('email', user.email || '');
    }
  }, [user, form]);

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationFormData & { eventId: string }) => {
      return await apiRequest("POST", `/api/events/${data.eventId}/register`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Registration Successful",
        description: "You have been registered for this event.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register for this event.",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest("DELETE", `/api/events/${eventId}/register`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Registration Cancelled",
        description: "Your registration has been cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Unable to cancel registration.",
        variant: "destructive",
      });
    },
  });

  const isRegistered = event ? userRegistrations.some(r => r.eventId === event.id) : false;

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return 'TBD';
    return timeStr;
  };

  const handleRegister = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: RegistrationFormData) => {
    if (!event) return;
    registerMutation.mutate({ ...data, eventId: event.id });
  };

  const handleShare = () => {
    if (navigator.share && event) {
      navigator.share({
        title: event.title,
        text: event.description || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 qd-container py-8">
          <Skeleton className="h-[300px] w-full rounded-xl mb-8" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 qd-container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/events">
            <Button data-testid="button-back-events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const spotsLeft = (event.capacity || 0) - (event.enrolledCount || 0);
  const isFull = spotsLeft <= 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title={event.title}
          subtitle={event.description || "Join us for this exciting event at The Quarterdeck"}
          testId="text-event-title"
        />

        <div className="qd-container py-8">
          <PageBreadcrumb 
            items={[
              { label: "Events", href: "/events" },
              { label: event.title }
            ]} 
          />

          <div className="grid lg:grid-cols-3 gap-8 mt-6">
            <div className="lg:col-span-2 space-y-6">
              {event.imageUrl && (
                <div className="relative overflow-hidden rounded-xl aspect-video">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                    data-testid="img-event-banner"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={eventTypeColors[event.type] || eventTypeColors.SOCIAL}>
                      {eventTypeLabels[event.type] || event.type}
                    </Badge>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About This Event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description || "Join us for an exciting event at The Quarterdeck Sports Complex. Whether you're a beginner or experienced player, this event offers something for everyone."}
                  </p>
                  
                  {event.instructor && (
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Instructor / Host</p>
                        <p className="font-medium">{event.instructor}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Schedule & Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{formatDate(event.scheduleDatetime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{formatTime(event.scheduleTime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-medium">{event.capacity || 'Unlimited'} participants</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">The Quarterdeck, Islamabad</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary mb-1">
                      {event.price === 0 ? 'Free' : `PKR ${(event.price || 0).toLocaleString()}`}
                    </div>
                    <p className="text-sm text-muted-foreground">per person</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spots Available</span>
                      <span className={`font-medium ${isFull ? 'text-destructive' : spotsLeft <= 5 ? 'text-amber-600' : ''}`}>
                        {isFull ? 'Full' : `${spotsLeft} left`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Enrolled</span>
                      <span className="font-medium">{event.enrolledCount || 0} / {event.capacity || '∞'}</span>
                    </div>
                    {event.enrollmentDeadline && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-medium">{formatDate(event.enrollmentDeadline)}</span>
                      </div>
                    )}
                  </div>

                  {isRegistered ? (
                    <div className="space-y-3">
                      <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Check className="w-4 h-4 mr-2" />
                        You're Registered
                      </Badge>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => cancelMutation.mutate(event.id)}
                        disabled={cancelMutation.isPending}
                        data-testid="button-cancel-registration"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Cancel Registration
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={handleRegister}
                      disabled={isFull}
                      data-testid="button-register-event"
                    >
                      {isFull ? 'Event Full' : 'Register Now'}
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    className="w-full mt-3"
                    onClick={handleShare}
                    data-testid="button-share-event"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </Button>
                </CardContent>
              </Card>

              <Link href="/events">
                <Button variant="outline" className="w-full" data-testid="button-back-events">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Login Required
            </DialogTitle>
            <DialogDescription>
              Please log in to register for this event.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Link href="/login" className="flex-1">
              <Button className="w-full" data-testid="button-login-prompt">Log In</Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button variant="outline" className="w-full" data-testid="button-signup-prompt">Sign Up</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register for {event.title}</DialogTitle>
            <DialogDescription>
              Complete the form below to register for this event.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-reg-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-reg-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-reg-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-reg-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-submit-registration"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
