import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Loader2, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  CreditCard,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { MembershipApplication } from "@shared/schema";

const bankDetails = {
  bankName: "MCB Bank",
  accountTitle: "Quarterdeck Sports Complex",
  accountNumber: "0123456789012345",
  iban: "PK00MCBL0123456789012345",
  branchCode: "0123",
};

const tierPrices: Record<string, number> = {
  FOUNDING: 35000,
  GOLD: 15000,
  SILVER: 5000,
};

interface MembershipApplicationFormProps {
  onSuccess?: () => void;
}

export function MembershipApplicationForm({ onSuccess }: MembershipApplicationFormProps) {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("bank_transfer");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingApplications, isLoading: applicationsLoading } = useQuery<MembershipApplication[]>({
    queryKey: ["/api/membership-applications/mine"],
  });

  const pendingApplication = existingApplications?.find(app => app.status === "PENDING");

  const createApplicationMutation = useMutation({
    mutationFn: async (data: { tierDesired: string; paymentMethod: string; paymentAmount: number }) => {
      return await apiRequest("POST", "/api/membership-applications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-applications/mine"] });
      toast({ title: "Application submitted", description: "Please upload your payment proof to complete the application." });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to submit application", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/membership-applications/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership-applications/mine"] });
      toast({ title: "Payment proof uploaded", description: "Your application is now under review. We'll notify you once it's processed." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to upload payment proof", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload an image (JPEG, PNG, WebP) or PDF", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/membership/upload-payment-proof', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Upload failed');
      const result = await res.json();
      setUploadedProof({ name: file.name, url: result.url });
      toast({ title: "File uploaded successfully" });
    } catch (error) {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitApplication = () => {
    if (!selectedTier) {
      toast({ title: "Please select a membership tier", variant: "destructive" });
      return;
    }
    createApplicationMutation.mutate({
      tierDesired: selectedTier,
      paymentMethod,
      paymentAmount: tierPrices[selectedTier] || 0,
    });
  };

  const handleUploadProof = () => {
    if (!pendingApplication || !uploadedProof) return;
    updateApplicationMutation.mutate({
      id: pendingApplication.id,
      data: {
        paymentProofUrl: uploadedProof.url,
        paymentReference,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (applicationsLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (pendingApplication) {
    const needsProof = !pendingApplication.paymentProofUrl;
    
    return (
      <Card data-testid="card-pending-application">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Your Membership Application
          </CardTitle>
          <CardDescription>
            {needsProof 
              ? "Please complete your payment and upload proof to proceed"
              : "Your application is being reviewed by our team"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">{pendingApplication.tierDesired} Membership</p>
              <p className="text-sm text-muted-foreground">
                Applied on {pendingApplication.createdAt ? format(new Date(pendingApplication.createdAt), "PPP") : "N/A"}
              </p>
            </div>
            {getStatusBadge(pendingApplication.status || "PENDING")}
          </div>

          {needsProof && (
            <>
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Bank Transfer Details</h3>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Name:</span>
                    <span className="font-medium">{bankDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Title:</span>
                    <span className="font-medium">{bankDetails.accountTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-medium">{bankDetails.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IBAN:</span>
                    <span className="font-medium text-xs sm:text-sm">{bankDetails.iban}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-primary">PKR {(pendingApplication.paymentAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentReference">Payment Reference / Transaction ID</Label>
                  <Input
                    id="paymentReference"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter your transaction reference number"
                    className="mt-1"
                    data-testid="input-payment-reference"
                  />
                </div>

                <div>
                  <Label>Payment Proof (Screenshot/Receipt)</Label>
                  <div className="mt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full"
                      data-testid="button-upload-proof"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploadedProof ? uploadedProof.name : "Upload Payment Proof"}
                    </Button>
                    {uploadedProof && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>File uploaded: {uploadedProof.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleUploadProof}
                  disabled={!uploadedProof || updateApplicationMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-proof"
                >
                  {updateApplicationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Payment Proof
                </Button>
              </div>
            </>
          )}

          {!needsProof && (
            <div className="p-4 bg-primary/5 rounded-lg text-center">
              <FileText className="w-10 h-10 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">
                Your payment proof has been submitted. Our team will review your application and notify you once approved.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-new-application">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Apply for Membership
        </CardTitle>
        <CardDescription>
          Choose your membership tier and complete the payment to join The Quarterdeck
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="tier">Select Membership Tier</Label>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="mt-1" data-testid="select-tier">
              <SelectValue placeholder="Choose a membership tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GOLD">Gold Membership - PKR 15,000/month</SelectItem>
              <SelectItem value="SILVER">Silver Membership - PKR 5,000/month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="mt-1" data-testid="select-payment-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="cash">Cash (at reception)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedTier && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Fee:</span>
              <span className="text-xl font-bold">PKR {(tierPrices[selectedTier] || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmitApplication}
          disabled={!selectedTier || createApplicationMutation.isPending}
          className="w-full"
          data-testid="button-submit-application"
        >
          {createApplicationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Start Application
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          After submitting, you'll receive bank details for payment. Upload your payment proof to complete the application.
        </p>
      </CardContent>
    </Card>
  );
}
