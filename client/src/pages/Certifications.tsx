import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageBreadcrumb } from "@/components/layout/PageBreadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Award, Calendar, Clock, Users, FileCheck, AlertTriangle, CheckCircle, Upload, BookOpen } from "lucide-react";
import type { Certification, CertificationClass, UserCertification, CertificationEnrollment } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";

export default function Certifications() {
  useSEO({
    title: "Certifications & Training",
    description: "Get certified for specialized facilities at The Quarterdeck. Enroll in training classes and obtain required certifications for Air Rifle Range and other facilities.",
  });
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [submitForm, setSubmitForm] = useState({
    certificateNumber: "",
    expiresAt: "",
    notes: "",
    proofFile: null as File | null,
  });

  const { data: certifications = [], isLoading: loadingCerts } = useQuery<Certification[]>({
    queryKey: ["/api/certifications"],
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery<CertificationClass[]>({
    queryKey: ["/api/certification-classes"],
  });

  const { data: myCertifications = [], isLoading: loadingMyCerts } = useQuery<UserCertification[]>({
    queryKey: ["/api/my-certifications"],
    enabled: isAuthenticated,
  });

  const { data: myEnrollments = [], isLoading: loadingEnrollments } = useQuery<CertificationEnrollment[]>({
    queryKey: ["/api/my-enrollments"],
    enabled: isAuthenticated,
  });

  const enrollMutation = useMutation({
    mutationFn: async (classId: string) => {
      const response = await fetch(`/api/certification-classes/${classId}/enroll`, { 
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Enrollment failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certification-classes"] });
      toast({ title: "Success", description: "You have been enrolled in the class." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/my-certifications/submit", {
        method: "POST",
        body: data,
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Submission failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-certifications"] });
      setSubmitDialogOpen(false);
      setSubmitForm({ certificateNumber: "", expiresAt: "", notes: "", proofFile: null });
      setSelectedCertification(null);
      toast({ title: "Submitted", description: "Your certification has been submitted for verification." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitCertification = () => {
    if (!selectedCertification) return;
    const formData = new FormData();
    formData.append("certificationId", selectedCertification.id);
    if (submitForm.certificateNumber) formData.append("certificateNumber", submitForm.certificateNumber);
    if (submitForm.expiresAt) formData.append("expiresAt", submitForm.expiresAt);
    if (submitForm.notes) formData.append("notes", submitForm.notes);
    if (submitForm.proofFile) formData.append("proofDocument", submitForm.proofFile);
    submitMutation.mutate(formData);
  };

  const getCertificationForClass = (classItem: CertificationClass) => {
    return certifications.find(c => c.id === classItem.certificationId);
  };

  const isEnrolled = (classId: string) => {
    return myEnrollments.some(e => e.classId === classId);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><Clock className="w-3 h-3 mr-1" /> Pending Verification</Badge>;
      case "REVOKED":
      case "EXPIRED":
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400"><AlertTriangle className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const activeCertifications = myCertifications.filter(c => c.status === "ACTIVE");
  const pendingCertifications = myCertifications.filter(c => c.status === "PENDING");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <PageHero 
        title="Certifications & Training"
        subtitle="Some facilities require safety certifications. View available classes or submit your existing credentials."
      />
      <PageBreadcrumb 
        items={[
          { label: "Home", href: "/" },
          { label: "Certifications" },
        ]} 
      />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="classes" data-testid="tab-classes">Classes</TabsTrigger>
            <TabsTrigger value="my-certs" data-testid="tab-my-certs">My Certs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Available Certifications</h2>
              <p className="text-muted-foreground">These certifications may be required for certain facilities</p>
            </div>

            {loadingCerts ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
                ))}
              </div>
            ) : certifications.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No certifications available at this time.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certifications.map(cert => {
                  const userHasCert = activeCertifications.some(uc => uc.certificationId === cert.id);
                  const userPending = pendingCertifications.some(uc => uc.certificationId === cert.id);
                  
                  return (
                    <Card key={cert.id} data-testid={`card-certification-${cert.id}`} className={userHasCert ? "border-green-500/50" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <Award className="w-8 h-8 text-primary shrink-0" />
                          {userHasCert && <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Certified</Badge>}
                          {userPending && <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Pending</Badge>}
                        </div>
                        <CardTitle className="text-lg">{cert.name}</CardTitle>
                        <CardDescription>{cert.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {cert.validityMonths && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Valid for {cert.validityMonths} months</span>
                          </div>
                        )}
                        {cert.facilityId && (
                          <Badge variant="destructive">Required for facility access</Badge>
                        )}
                      </CardContent>
                      <CardFooter>
                        {!isAuthenticated ? (
                          <Button variant="outline" className="w-full" asChild>
                            <a href="/login">Sign in to submit</a>
                          </Button>
                        ) : userHasCert ? (
                          <Button variant="secondary" className="w-full" disabled>Already Certified</Button>
                        ) : userPending ? (
                          <Button variant="secondary" className="w-full" disabled>Verification Pending</Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => { setSelectedCertification(cert); setSubmitDialogOpen(true); }}
                            data-testid={`button-submit-cert-${cert.id}`}
                          >
                            <Upload className="w-4 h-4 mr-2" /> Submit Certification
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upcoming Training Classes</h2>
              <p className="text-muted-foreground">Enroll in a class to get certified at our facility</p>
            </div>

            {loadingClasses ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-40" /></CardContent></Card>
                ))}
              </div>
            ) : classes.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No upcoming classes scheduled. Check back later.</CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {classes.map(cls => {
                  const certification = getCertificationForClass(cls);
                  const enrolled = isEnrolled(cls.id);
                  const isFull = (cls.enrolledCount || 0) >= (cls.capacity || Infinity);
                  
                  return (
                    <Card key={cls.id} data-testid={`card-class-${cls.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <BookOpen className="w-6 h-6 text-primary" />
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary">{certification?.name || "Certification"}</Badge>
                            {enrolled && <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Enrolled</Badge>}
                          </div>
                        </div>
                        <CardTitle>{cls.title}</CardTitle>
                        <CardDescription>{cls.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {cls.scheduledDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(cls.scheduledDate), "PPP 'at' p")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{cls.enrolledCount || 0} / {cls.capacity || "Unlimited"} enrolled</span>
                        </div>
                        {cls.location && (
                          <div className="text-sm text-muted-foreground">Location: {cls.location}</div>
                        )}
                        {cls.price && Number(cls.price) > 0 && (
                          <div className="text-lg font-semibold">PKR {Number(cls.price).toLocaleString()}</div>
                        )}
                      </CardContent>
                      <CardFooter>
                        {!isAuthenticated ? (
                          <Button variant="outline" className="w-full" asChild>
                            <a href="/login">Sign in to enroll</a>
                          </Button>
                        ) : enrolled ? (
                          <Button variant="secondary" className="w-full" disabled>Already Enrolled</Button>
                        ) : isFull ? (
                          <Button variant="secondary" className="w-full" disabled>Class Full</Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            onClick={() => enrollMutation.mutate(cls.id)}
                            disabled={enrollMutation.isPending}
                            data-testid={`button-enroll-${cls.id}`}
                          >
                            Enroll Now
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-certs" className="space-y-6">
            {!isAuthenticated ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">Sign in to view your certifications</p>
                  <Button asChild><a href="/login">Sign In</a></Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">My Certifications</h2>
                  <p className="text-muted-foreground">Track your certifications and class enrollments</p>
                </div>

                {loadingMyCerts || loadingEnrollments ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>)}
                  </div>
                ) : myCertifications.length === 0 && myEnrollments.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <FileCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>You don't have any certifications yet.</p>
                      <p className="mt-2">Submit your existing certificates or enroll in a training class.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {myCertifications.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Issued Certifications</h3>
                        {myCertifications.map(uc => {
                          const cert = certifications.find(c => c.id === uc.certificationId);
                          return (
                            <Card key={uc.id} data-testid={`card-my-cert-${uc.id}`}>
                              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                  <Award className="w-8 h-8 text-primary" />
                                  <div>
                                    <p className="font-medium">{cert?.name || "Certification"}</p>
                                    {uc.certificateNumber && (
                                      <p className="text-sm text-muted-foreground">#{uc.certificateNumber}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                  {getStatusBadge(uc.status)}
                                  {uc.expiresAt && (
                                    <span className="text-sm text-muted-foreground">
                                      Expires: {format(new Date(uc.expiresAt), "PP")}
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {myEnrollments.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Class Enrollments</h3>
                        {myEnrollments.map(enrollment => {
                          const classItem = classes.find(c => c.id === enrollment.classId);
                          return (
                            <Card key={enrollment.id} data-testid={`card-enrollment-${enrollment.id}`}>
                              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                  <BookOpen className="w-8 h-8 text-primary" />
                                  <div>
                                    <p className="font-medium">{classItem?.title || "Training Class"}</p>
                                    {classItem?.scheduledDate && (
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(classItem.scheduledDate), "PPP 'at' p")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="secondary">{enrollment.status}</Badge>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Certification</DialogTitle>
            <DialogDescription>
              Upload proof of your {selectedCertification?.name} certification for verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number (optional)</Label>
              <Input
                id="certificateNumber"
                value={submitForm.certificateNumber}
                onChange={e => setSubmitForm(prev => ({ ...prev, certificateNumber: e.target.value }))}
                placeholder="Enter your certificate number"
                data-testid="input-certificate-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={submitForm.expiresAt}
                onChange={e => setSubmitForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                data-testid="input-expires-at"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proofFile">Proof Document</Label>
              <Input
                id="proofFile"
                type="file"
                accept="image/*,.pdf"
                onChange={e => setSubmitForm(prev => ({ ...prev, proofFile: e.target.files?.[0] || null }))}
                data-testid="input-proof-file"
              />
              <p className="text-xs text-muted-foreground">Upload an image or PDF of your certificate</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                value={submitForm.notes}
                onChange={e => setSubmitForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional information..."
                data-testid="input-notes"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitCertification} 
              disabled={submitMutation.isPending}
              data-testid="button-submit-certification"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
