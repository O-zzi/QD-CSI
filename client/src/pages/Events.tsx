import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Users, Clock, Trophy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: userRegistrations = [] } = useQuery<{ eventId: string }[]>({
    queryKey: ['/api/user/event-registrations'],
    enabled: !!user,
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest("POST", `/api/events/${eventId}/register`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/event-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Registration Successful",
        description: "You have been registered for this event.",
      });
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

  const handleRegister = (eventId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to register for events.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(eventId);
  };

  const handleCancel = (eventId: string) => {
    cancelMutation.mutate(eventId);
  };

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
              <h1 className="text-xl font-bold" data-testid="text-events-title">Events & Academies</h1>
              <p className="text-xs text-muted-foreground">Tournaments, leagues, and training programs</p>
            </div>
          </div>
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
                          onClick={() => handleRegister(event.id)}
                          disabled={isProcessing || isFull}
                          data-testid={`button-register-event-${event.id}`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isFull ? (
                            'Full'
                          ) : (
                            'Register'
                          )}
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
    </div>
  );
}
