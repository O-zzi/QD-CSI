import { useState } from "react";
import { Link } from "wouter";
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
import { Calendar, Users, Clock, Trophy, Check, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const registrationFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  guestCount: z.number().min(0).max(10).default(0),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
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
  
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: userRegistrations = [] } = useQuery<{ eventId: string }[]>({
    queryKey: ['/api/user/event-registrations'],
    enabled: !!user,
  });

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
      setSelectedEvent(null);
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

  const isRegistered = (eventId: string) => {
    return userRegistrations.some(r => r.eventId === eventId);
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const eventTypeColors: Record<string, string> = {
    TOURNAMENT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    CLASS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    ACADEMY: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    SOCIAL: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
  };

  const openRegistrationDialog = (event: Event) => {
    setSelectedEvent(event);
    
    // Show login prompt if not authenticated
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    // Pre-fill form with user data
    form.setValue("fullName", user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || "");
    form.setValue("email", user.email || "");
    setIsDialogOpen(true);
  };

  const handleRegistrationSubmit = (data: RegistrationFormData) => {
    if (!selectedEvent) return;
    registerMutation.mutate({ ...data, eventId: selectedEvent.id });
  };

  const handleCancel = (eventId: string) => {
    cancelMutation.mutate(eventId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="bg-primary py-8 md:py-12">
          <div className="qd-container text-center text-primary-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-events-title">
              Events & Academies
            </h1>
            <p className="text-sm opacity-80 max-w-2xl mx-auto">
              Tournaments, leagues, and training programs
            </p>
          </div>
        </div>

        <div className="qd-container py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const registered = isRegistered(event.id);
              const isFull = (event.enrolledCount || 0) >= (event.capacity || 0);
              const isProcessing = registerMutation.isPending || cancelMutation.isPending;
              
              return (
                <Card key={event.id} className="overflow-hidden hover-elevate" data-testid={`card-event-${event.id}`}>
                  <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-amber-400/50" />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <Badge className={eventTypeColors[event.type] || eventTypeColors.SOCIAL}>
                        {event.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.scheduleDay} {event.scheduleTime || ''}</span>
                      </div>
                      
                      {event.instructor && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Instructor: {event.instructor}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.enrolledCount || 0} / {event.capacity} enrolled</span>
                      </div>
                      
                      {event.enrollmentDeadline && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Register by {formatDate(event.enrollmentDeadline)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t gap-2">
                      <div className="font-semibold text-sky-600">
                        PKR {event.price?.toLocaleString() || 'Free'}
                      </div>
                      
                      {registered ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCancel(event.id)}
                          disabled={isProcessing}
                          data-testid={`button-cancel-event-${event.id}`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Registered
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => openRegistrationDialog(event)}
                          disabled={isFull}
                          data-testid={`button-register-event-${event.id}`}
                        >
                          {isFull ? 'Full' : 'Register'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground mb-6">
                Check back soon for tournaments, leagues, and training programs.
              </p>
              <Link href="/">
                <Button variant="outline" data-testid="button-back-to-home">
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        </div>
      </main>

      <Footer />

      {/* Registration Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-registration-title">Event Registration</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title && (
                <span className="font-medium text-foreground">{selectedEvent.title}</span>
              )}
              {selectedEvent?.price ? ` - PKR ${selectedEvent.price.toLocaleString()}` : ' - Free'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleRegistrationSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your full name" 
                        {...field} 
                        data-testid="input-reg-fullname"
                      />
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
                      <Input 
                        type="email"
                        placeholder="your@email.com" 
                        {...field} 
                        data-testid="input-reg-email"
                      />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+92 300 1234567" 
                        {...field} 
                        data-testid="input-reg-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Guests</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min={0}
                        max={10}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-reg-guests"
                      />
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
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special requirements or notes..."
                        className="resize-none"
                        {...field} 
                        data-testid="textarea-reg-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-registration"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Dialog */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-login-prompt-title">
              <LogIn className="w-5 h-5" />
              Sign In Required
            </DialogTitle>
            <DialogDescription>
              Please sign in to register for this event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedEvent && (
              <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg mb-4">
                <h4 className="font-semibold">{selectedEvent.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedEvent.scheduleDay} {selectedEvent.scheduleTime || ''}
                </p>
                <p className="text-sm font-medium text-sky-600 mt-2">
                  PKR {selectedEvent.price?.toLocaleString() || 'Free'}
                </p>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-4">
              Create an account or sign in to complete your registration. Your membership will be set up automatically.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button className="w-full" data-testid="button-login-to-register">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => setShowLoginPrompt(false)}
              data-testid="button-cancel-login-prompt"
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
