import { useState, useRef, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Clock, Trophy, Check, Loader2, LogIn, Upload, Building2, Banknote, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { useCmsMultiple, CMS_DEFAULTS } from "@/hooks/useCms";
import { useSEO } from "@/hooks/use-seo";

const registrationFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  guestCount: z.number().min(0).max(10).default(0),
  notes: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'cash']).optional(),
});

type RegistrationFormData = z.infer<typeof registrationFormSchema>;

export default function Events() {
  useSEO({
    title: "Events & Tournaments",
    description: "Discover upcoming events, tournaments, and classes at The Quarterdeck. Register for sports competitions, training clinics, and social events in Islamabad.",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Payment proof upload state
  const [showProofUploadDialog, setShowProofUploadDialog] = useState(false);
  const [pendingRegistrationId, setPendingRegistrationId] = useState<string | null>(null);
  const [pendingRegistrationAmount, setPendingRegistrationAmount] = useState<number>(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const { getValue } = useCmsMultiple([
    'page_events_title',
    'page_events_subtitle',
    'page_events_upcoming_title',
    'page_events_no_events',
    'page_events_register_cta',
  ], CMS_DEFAULTS);
  
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      guestCount: 0,
      notes: "",
      paymentMethod: "bank_transfer",
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
      const response = await apiRequest("POST", `/api/events/${data.eventId}/register`, data);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Failed to register for event');
      }
      return result;
    },
    onSuccess: (result: any, variables) => {
      if (!isMountedRef.current) return;
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      
      const isPaidEvent = selectedEvent && (selectedEvent.price || 0) > 0;
      const isBankTransfer = variables.paymentMethod === 'bank_transfer';
      
      if (isPaidEvent && isBankTransfer && result?.id) {
        // Show payment proof upload dialog
        setPendingRegistrationId(result.id);
        setPendingRegistrationAmount(selectedEvent?.price || 0);
        setProofFile(null);
        setShowProofUploadDialog(true);
        toast({
          title: "Registration Submitted!",
          description: "Please upload your payment receipt to complete the registration.",
        });
      } else if (isPaidEvent && variables.paymentMethod === 'cash') {
        toast({
          title: "Registration Submitted!",
          description: "Please pay at the facility. Your registration will be confirmed upon payment verification.",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "You have been registered for this event.",
        });
      }
      
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
        <PageHero 
          title={getValue('page_events_title')}
          subtitle={getValue('page_events_subtitle')}
          testId="text-events-title"
        />

        <div className="qd-container py-8">
          <PageBreadcrumb />
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
                  <Link href={`/events/${event.slug || event.id}`}>
                    <div className="h-40 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center cursor-pointer">
                      <Trophy className="w-16 h-16 text-amber-400/50" />
                    </div>
                  </Link>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/events/${event.slug || event.id}`}>
                        <CardTitle className="text-lg cursor-pointer hover:text-primary transition-colors">{event.title}</CardTitle>
                      </Link>
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
                      
                      <div className="flex gap-2">
                        <Link href={`/events/${event.slug || event.id}`}>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            data-testid={`button-view-event-${event.id}`}
                          >
                            View
                          </Button>
                        </Link>
                        {registered ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleCancel(event.id); }}
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
                            onClick={(e) => { e.stopPropagation(); openRegistrationDialog(event); }}
                            disabled={isFull}
                            data-testid={`button-register-event-${event.id}`}
                          >
                            {isFull ? 'Full' : 'Register'}
                          </Button>
                        )}
                      </div>
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
              
              {/* Payment Method - only for paid events */}
              {selectedEvent && (selectedEvent.price || 0) > 0 && (
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value || "bank_transfer"}
                          onValueChange={field.onChange}
                          className="flex flex-col gap-3"
                        >
                          <div className="flex items-center gap-3 p-3 border rounded-md hover-elevate">
                            <RadioGroupItem value="bank_transfer" id="evt-bank" data-testid="radio-event-bank-transfer" />
                            <Label htmlFor="evt-bank" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Building2 className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Bank Transfer</div>
                                <div className="text-xs text-muted-foreground">Transfer to our bank account</div>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-md hover-elevate">
                            <RadioGroupItem value="cash" id="evt-cash" data-testid="radio-event-cash" />
                            <Label htmlFor="evt-cash" className="flex items-center gap-2 cursor-pointer flex-1">
                              <Banknote className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Cash Payment</div>
                                <div className="text-xs text-muted-foreground">Pay at the facility</div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
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

      {/* Payment Proof Upload Dialog */}
      <Dialog open={showProofUploadDialog} onOpenChange={(open) => {
        if (!open && !uploadingProof) {
          setShowProofUploadDialog(false);
          setPendingRegistrationId(null);
          setProofFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-proof-upload-title">
              <Upload className="w-5 h-5" />
              Upload Payment Receipt
            </DialogTitle>
            <DialogDescription>
              Please upload a screenshot or photo of your bank transfer receipt.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
              <p className="text-sm font-medium text-sky-800 dark:text-sky-200">Amount to Transfer</p>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                PKR {pendingRegistrationAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Bank details will be provided in your confirmation email
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast({
                      title: "File too large",
                      description: "Please upload a file smaller than 5MB",
                      variant: "destructive",
                    });
                    return;
                  }
                  setProofFile(file);
                }
              }}
              className="hidden"
              data-testid="input-event-proof-file"
            />
            
            {proofFile ? (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{proofFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(proofFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setProofFile(null)}
                  data-testid="button-remove-event-proof"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-select-event-proof"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select File
              </Button>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Accepted formats: JPG, PNG, PDF (max 5MB)
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowProofUploadDialog(false);
                setPendingRegistrationId(null);
                setProofFile(null);
                toast({
                  title: "Reminder",
                  description: "You can upload your payment receipt later from My Profile.",
                });
              }}
              disabled={uploadingProof}
              data-testid="button-skip-event-proof"
            >
              Upload Later
            </Button>
            <Button
              onClick={async () => {
                if (!proofFile || !pendingRegistrationId || uploadingProof) return;
                
                setUploadingProof(true);
                try {
                  const formData = new FormData();
                  formData.append('proof', proofFile);
                  
                  const response = await fetch(`/api/event-registrations/${pendingRegistrationId}/upload-proof`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to upload proof');
                  }
                  
                  if (isMountedRef.current) {
                    toast({
                      title: "Receipt Uploaded!",
                      description: "Your payment proof has been submitted for verification.",
                    });
                    setShowProofUploadDialog(false);
                    setPendingRegistrationId(null);
                    setProofFile(null);
                    queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
                  }
                } catch (error: any) {
                  if (isMountedRef.current) {
                    toast({
                      title: "Upload Failed",
                      description: error.message || "Failed to upload payment proof",
                      variant: "destructive",
                    });
                  }
                } finally {
                  if (isMountedRef.current) {
                    setUploadingProof(false);
                  }
                }
              }}
              disabled={!proofFile || uploadingProof}
              data-testid="button-submit-event-proof"
            >
              {uploadingProof ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit Receipt'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
