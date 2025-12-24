import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Briefcase, ChevronRight, Loader2, Send, Linkedin, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Career } from "@shared/schema";

const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  cvUrl: z.string().url("Please enter a valid URL to your CV/resume").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  coverLetter: z.string().min(50, "Cover letter should be at least 50 characters"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const defaultJobs = [
  {
    id: "1",
    title: "Sports Facility Manager",
    department: "Operations",
    location: "Islamabad",
    type: "Full-time",
    description: "Lead the day-to-day operations of our sports facilities, ensuring excellent member experience and efficient facility management.",
    requirements: "5+ years experience in sports facility management. Strong leadership and communication skills. Knowledge of sports equipment maintenance.",
    salary: "PKR 150,000 - 200,000 / month",
    isActive: true,
  },
  {
    id: "2",
    title: "Padel Tennis Coach",
    department: "Sports",
    location: "Islamabad",
    type: "Full-time",
    description: "Provide professional coaching for our Padel Tennis program, conducting group classes and private lessons for members of all skill levels.",
    requirements: "Certified Padel Tennis instructor. 3+ years coaching experience. Fluent in English and Urdu.",
    salary: "PKR 80,000 - 120,000 / month",
    isActive: true,
  },
  {
    id: "3",
    title: "Member Relations Officer",
    department: "Customer Service",
    location: "Islamabad",
    type: "Full-time",
    description: "Serve as the primary point of contact for members, handling inquiries, feedback, and ensuring exceptional service standards.",
    requirements: "2+ years customer service experience. Excellent communication skills. Proficiency in CRM systems.",
    salary: "PKR 50,000 - 70,000 / month",
    isActive: true,
  },
  {
    id: "4",
    title: "Range Safety Officer",
    department: "Safety",
    location: "Islamabad",
    type: "Full-time",
    description: "Ensure safe operations of the Air Rifle Range, conduct safety certifications, and supervise shooting sessions.",
    requirements: "Military or law enforcement background preferred. Safety certification required. First aid trained.",
    salary: "PKR 60,000 - 90,000 / month",
    isActive: true,
  },
  {
    id: "5",
    title: "Events Coordinator",
    department: "Events",
    location: "Islamabad",
    type: "Part-time",
    description: "Plan and execute tournaments, social events, and corporate functions at The Quarterdeck.",
    requirements: "Event management experience. Strong organizational skills. Weekend availability required.",
    salary: "PKR 40,000 - 60,000 / month",
    isActive: true,
  },
];

export default function Careers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<typeof defaultJobs[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCvDialogOpen, setIsCvDialogOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const { data: careers } = useQuery<Career[]>({
    queryKey: ["/api/careers"],
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cvUrl: "",
      linkedinUrl: "",
      coverLetter: "",
    },
  });

  const cvForm = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cvUrl: "",
      linkedinUrl: "",
      coverLetter: "",
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: ApplicationFormData & { careerId: string }) => {
      return await apiRequest("POST", `/api/careers/${data.careerId}/apply`, {
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        cvUrl: data.cvUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        coverLetter: data.coverLetter,
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Thank you for your application. We will review it and get back to you soon.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generalCvMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      return await apiRequest("POST", "/api/careers/general-application", {
        fullName: data.name,
        email: data.email,
        phone: data.phone,
        cvUrl: data.cvUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        coverLetter: data.coverLetter,
      });
    },
    onSuccess: () => {
      toast({
        title: "CV Submitted",
        description: "Thank you for your interest! We will keep your CV on file for future opportunities.",
      });
      setIsCvDialogOpen(false);
      cvForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit CV. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    if (selectedJob) {
      applyMutation.mutate({ ...data, careerId: selectedJob.id });
    }
  };

  const handleApply = (job: { id: string; title: string }) => {
    setSelectedJob(job as typeof defaultJobs[0]);
    setIsDialogOpen(true);
  };

  const jobListings = careers && careers.length > 0 ? careers : defaultJobs;
  const activeJobs = jobListings.filter(job => job.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary py-8 md:py-12">
          <div className="qd-container text-center text-primary-foreground">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-careers-title">
              Join Our Team
            </h1>
            <p className="text-sm opacity-80 max-w-3xl mx-auto">
              Be part of Islamabad's premier sports and recreation destination
            </p>
          </div>
        </div>

        <div className="qd-container py-12">
          <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#2a4060] dark:text-sky-400 mb-4">Why Work at The Quarterdeck?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2a4060]/10 dark:bg-sky-400/10 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-6 h-6 text-[#2a4060] dark:text-sky-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Career Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    Opportunities for advancement and professional development
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2a4060]/10 dark:bg-sky-400/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-[#2a4060] dark:text-sky-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Prime Location</h3>
                  <p className="text-sm text-muted-foreground">
                    Work in a beautiful, state-of-the-art facility in Islamabad
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#2a4060]/10 dark:bg-sky-400/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-[#2a4060] dark:text-sky-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Flexible Hours</h3>
                  <p className="text-sm text-muted-foreground">
                    Various shift options to accommodate work-life balance
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#2a4060] dark:text-sky-400 mb-6">Open Positions</h2>
            
            {activeJobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    No open positions at the moment. Check back soon or send us your CV for future opportunities.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <Badge variant="secondary" className="text-xs">{job.type}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" /> {job.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" /> {job.location}
                            </span>
                            {isAdmin && job.salary && (
                              <span className="text-[#2a4060] dark:text-sky-400 font-medium">{job.salary}</span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">{job.description}</p>
                          {job.requirements && (
                            <p className="text-sm">
                              <span className="font-medium">Requirements: </span>
                              <span className="text-muted-foreground">{job.requirements}</span>
                            </p>
                          )}
                        </div>
                        <Button 
                          className="bg-[#2a4060] hover:bg-[#1e3048] flex-shrink-0"
                          onClick={() => handleApply(job)}
                          data-testid={`button-apply-${job.id}`}
                        >
                          Apply Now <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="mt-12">
            <CardHeader>
              <CardTitle>Don't See the Right Fit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We're always looking for talented individuals to join our team. Send us your CV 
                and we'll keep you in mind for future opportunities.
              </p>
              <Button 
                className="bg-[#2a4060] hover:bg-[#1e3048]"
                onClick={() => setIsCvDialogOpen(true)}
                data-testid="button-submit-cv"
              >
                <FileText className="w-4 h-4 mr-2" /> Send Your CV
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your application
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-applicant-name" />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} data-testid="input-applicant-email" />
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
                      <Input placeholder="+92 300 1234567" {...field} data-testid="input-applicant-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cvUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CV/Resume URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://drive.google.com/..." {...field} data-testid="input-applicant-cv" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Share a link to your CV on Google Drive, Dropbox, or similar service
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/..." {...field} data-testid="input-applicant-linkedin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                        className="min-h-[120px]"
                        {...field} 
                        data-testid="input-applicant-cover-letter"
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
                  data-testid="button-cancel-application"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={applyMutation.isPending}
                  className="bg-[#2a4060] hover:bg-[#1e3048]"
                  data-testid="button-submit-application"
                >
                  {applyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Application
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCvDialogOpen} onOpenChange={setIsCvDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Your CV</DialogTitle>
            <DialogDescription>
              Submit your CV for future opportunities at The Quarterdeck
            </DialogDescription>
          </DialogHeader>
          
          <Form {...cvForm}>
            <form onSubmit={cvForm.handleSubmit((data) => generalCvMutation.mutate(data))} className="space-y-4">
              <FormField
                control={cvForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-cv-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cvForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} data-testid="input-cv-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cvForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+92 300 1234567" {...field} data-testid="input-cv-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cvForm.control}
                name="cvUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CV/Resume URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://drive.google.com/..." {...field} data-testid="input-cv-url" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Share a link to your CV on Google Drive, Dropbox, or similar service
                    </p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={cvForm.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn Profile (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/..." {...field} data-testid="input-cv-linkedin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cvForm.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message / Cover Letter</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself, your skills, and what kind of role you're looking for..."
                        className="min-h-[120px]"
                        {...field} 
                        data-testid="input-cv-cover-letter"
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
                  onClick={() => setIsCvDialogOpen(false)}
                  data-testid="button-cancel-cv"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={generalCvMutation.isPending}
                  className="bg-[#2a4060] hover:bg-[#1e3048]"
                  data-testid="button-submit-cv-form"
                >
                  {generalCvMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit CV
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
