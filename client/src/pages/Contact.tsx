import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  MapPin, Phone, Mail, Clock, Send, MessageSquare, 
  Users, Calendar, Building2, ChevronRight, Loader2,
  Facebook, Instagram, Twitter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    queryFn: async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return {};
        const data = await res.json();
        return data && typeof data === 'object' && !data.message ? data : {};
      } catch {
        return {};
      }
    },
  });

  const getSetting = (key: string): string => {
    return settings[key] || "";
  };

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for your message. We'll get back to you soon!",
      });
      setSubmitted(true);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    submitMutation.mutate(data);
  };

  const quickLinks = [
    { icon: Calendar, title: "Book a Facility", description: "Reserve courts, halls, and more", href: "/booking" },
    { icon: Users, title: "Membership", description: "Join The Quarterdeck community", href: "/#membership" },
    { icon: Building2, title: "Our Facilities", description: "Explore what we offer", href: "/facilities" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <PageHero 
          title="Contact Us"
          subtitle="Get in touch with The Quarterdeck team. We're here to help with bookings, memberships, and any questions you may have."
          testId="text-contact-title"
        />

        <div className="qd-container py-8">
          <PageBreadcrumb />

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send Us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your message has been sent successfully. We'll respond within 24-48 hours.
                      </p>
                      <Button onClick={() => setSubmitted(false)} variant="outline">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} data-testid="input-contact-name" />
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
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your@email.com" {...field} data-testid="input-contact-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="+92 xxx xxxxxxx" {...field} data-testid="input-contact-phone" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject *</FormLabel>
                                <FormControl>
                                  <Input placeholder="What's this about?" {...field} data-testid="input-contact-subject" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="How can we help you?" 
                                  rows={5}
                                  {...field} 
                                  data-testid="input-contact-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full sm:w-auto"
                          disabled={submitMutation.isPending}
                          data-testid="button-contact-submit"
                        >
                          {submitMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>

              <div>
                <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <Card className="h-full hover-elevate cursor-pointer" data-testid={`link-quick-${link.title.toLowerCase().replace(/\s/g, '-')}`}>
                        <CardContent className="p-4">
                          <link.icon className="w-8 h-8 text-primary mb-3" />
                          <h3 className="font-semibold mb-1">{link.title}</h3>
                          <p className="text-sm text-muted-foreground">{link.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {getSetting("address") || "The Quarterdeck Sports Complex, Islamabad, Pakistan"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {getSetting("phone") || "+92 51 XXX XXXX"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        {getSetting("email") || "info@thequarterdeck.pk"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Operating Hours</p>
                      <p className="text-sm text-muted-foreground">
                        {getSetting("operating_hours") || "6:00 AM - 11:00 PM Daily"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Follow Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {getSetting("facebook") && (
                      <a 
                        href={getSetting("facebook")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center hover-elevate"
                        data-testid="link-social-facebook"
                      >
                        <Facebook className="w-5 h-5 text-primary" />
                      </a>
                    )}
                    {getSetting("instagram") && (
                      <a 
                        href={getSetting("instagram")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center hover-elevate"
                        data-testid="link-social-instagram"
                      >
                        <Instagram className="w-5 h-5 text-primary" />
                      </a>
                    )}
                    {getSetting("twitter") && (
                      <a 
                        href={getSetting("twitter")} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center hover-elevate"
                        data-testid="link-social-twitter"
                      >
                        <Twitter className="w-5 h-5 text-primary" />
                      </a>
                    )}
                    {!getSetting("facebook") && !getSetting("instagram") && !getSetting("twitter") && (
                      <p className="text-sm text-muted-foreground">Social links coming soon</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/booking" className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer" data-testid="link-faq-booking">
                    <span className="text-sm">How do I book a facility?</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link href="/#membership" className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer" data-testid="link-faq-membership">
                    <span className="text-sm">What membership options are available?</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link href="/rules" className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer" data-testid="link-faq-rules">
                    <span className="text-sm">What are the facility rules?</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link href="/events" className="flex items-center justify-between p-2 rounded-md hover-elevate cursor-pointer" data-testid="link-faq-events">
                    <span className="text-sm">How do I join events?</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
