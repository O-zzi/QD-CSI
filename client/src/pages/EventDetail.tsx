import { useState, useEffect, useRef } from "react";
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
  DollarSign, CalendarDays, Info, Upload, CreditCard,
  Building2, Copy, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event, SiteSetting } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { useSEO } from "@/hooks/use-seo";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registrationFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  guestCount: z.number().min(0).max(10).default(0),
  notes: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'cash']).optional(),
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{ id: string; isPaid: boolean } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('bank_transfer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: bankSettings } = useQuery<SiteSetting[]>({
    queryKey: ['/api/site-settings'],
    select: (settings) => settings.filter(s => 
      ['bank_name', 'bank_account_title', 'bank_account_number', 'bank_iban', 'bank_branch_code', 'bank_swift_code'].includes(s.key)
    ),
  });

  const getBankDetail = (key: string) => {
    const setting = bankSettings?.find(s => s.key === key);
    return setting?.value || '';
  };

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

  useSEO({
    title: event?.title || "Event Details",
    description: event?.description || "View event details and register for events at The Quarterdeck sports complex.",
    ogImage: event?.imageUrl || undefined,
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
      const response = await apiRequest("POST", `/api/events/${data.eventId}/register`, data);
      // Parse the JSON response properly
      const result = await response.json();
      return result;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsDialogOpen(false);
      form.reset();
      
      if (data.isPaidEvent) {
        setPendingRegistration({ id: data.id, isPaid: true });
        // If bank transfer, show payment dialog for proof upload
        if (paymentMethod === 'bank_transfer') {
          setShowPaymentDialog(true);
          toast({
            title: "Registration Initiated",
            description: "Please upload your payment proof to confirm your spot.",
          });
        } else {
          // Cash payment - just show success message
          toast({
            title: "Registration Successful",
            description: "Your registration is pending. Please pay at the venue to confirm your spot.",
          });
        }
      } else {
        toast({
          title: "Registration Successful",
          description: "You have been registered for this event.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register for this event.",
        variant: "destructive",
      });
    },
  });

  const handlePaymentProofUpload = async (file: File) => {
    if (!pendingRegistration) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('proof', file);
      
      const response = await fetch(`/api/event-registrations/${pendingRegistration.id}/upload-proof`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      toast({
        title: "Proof Uploaded",
        description: "Your payment proof has been submitted for verification.",
      });
      setShowPaymentDialog(false);
      setPendingRegistration(null);
      queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload payment proof.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

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
    // Include payment method for paid events - convert to uppercase for backend
    const backendPaymentMethod = paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : 'CASH';
    const submissionData = {
      ...data,
      eventId: event.id,
      paymentMethod: event.price && event.price > 0 ? backendPaymentMethod : undefined,
    };
    registerMutation.mutate(submissionData);
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
              
              {/* Payment method selection for paid events */}
              {event.price && event.price > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">Registration Fee: PKR {event.price.toLocaleString()}</span>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Payment Method *</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                          paymentMethod === 'cash'
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-muted text-foreground border-border hover:bg-muted/80'
                        }`}
                        data-testid="button-payment-cash-reg"
                      >
                        Pay On-Site (Cash)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                          paymentMethod === 'bank_transfer'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-muted text-foreground border-border hover:bg-muted/80'
                        }`}
                        data-testid="button-payment-bank-reg"
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>
                  
                  {paymentMethod === 'cash' && (
                    <p className="text-xs text-muted-foreground">
                      Pay in cash when you arrive at the event. Your registration is pending until payment.
                    </p>
                  )}
                  
                  {paymentMethod === 'bank_transfer' && (
                    <p className="text-xs text-muted-foreground">
                      After registration, you'll see bank details and can upload your payment proof.
                    </p>
                  )}
                </div>
              )}
              
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
                ) : event.price && event.price > 0 ? (
                  `Register & Proceed to Payment`
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Complete Payment
            </DialogTitle>
            <DialogDescription>
              Choose your payment method and complete the registration fee.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <span className="font-semibold">Amount: PKR {(event?.price || 0).toLocaleString()}</span>
                <br />
                Your spot will be confirmed once payment is verified.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Payment Method</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                    paymentMethod === 'cash'
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-muted text-foreground border-border hover:bg-muted/80'
                  }`}
                  data-testid="button-payment-cash"
                >
                  Pay On-Site (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition border ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-muted text-foreground border-border hover:bg-muted/80'
                  }`}
                  data-testid="button-payment-bank"
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Pay On-Site Instructions</h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  You can pay in cash when you arrive at the event. Please arrive early to complete payment and registration.
                </p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                  Your registration is pending until payment is received.
                </p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <>
                <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 text-purple-800 dark:text-purple-300">
                    <Building2 className="w-4 h-4" />
                    Bank Details
                  </h4>
                  
                  {getBankDetail('bank_name') && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-600 dark:text-purple-400">Bank</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-800 dark:text-purple-300">{getBankDetail('bank_name')}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(getBankDetail('bank_name'), 'Bank name')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {getBankDetail('bank_account_title') && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-600 dark:text-purple-400">Account Title</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-800 dark:text-purple-300">{getBankDetail('bank_account_title')}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(getBankDetail('bank_account_title'), 'Account title')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {getBankDetail('bank_account_number') && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-600 dark:text-purple-400">Account No.</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono text-purple-800 dark:text-purple-300">{getBankDetail('bank_account_number')}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(getBankDetail('bank_account_number'), 'Account number')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {getBankDetail('bank_iban') && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-purple-600 dark:text-purple-400">IBAN</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono text-xs text-purple-800 dark:text-purple-300">{getBankDetail('bank_iban')}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(getBankDetail('bank_iban'), 'IBAN')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload Payment Proof</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a screenshot or photo of your transfer receipt.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePaymentProofUpload(file);
                    }}
                    data-testid="input-payment-proof"
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-testid="button-upload-proof"
                  >
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Select File</>
                    )}
                  </Button>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={() => {
                  setShowPaymentDialog(false);
                  setPendingRegistration(null);
                }}
                data-testid="button-close-payment"
              >
                Close
              </Button>
              {paymentMethod === 'cash' && (
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={() => {
                    toast({
                      title: "Registration Complete!",
                      description: "Please pay in cash when you arrive at the event.",
                    });
                    setShowPaymentDialog(false);
                    setPendingRegistration(null);
                  }}
                  data-testid="button-confirm-cash"
                >
                  Confirm Registration
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
