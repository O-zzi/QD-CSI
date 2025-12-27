import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Eye,
  Loader2,
  ExternalLink,
  User,
  Calendar,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { MembershipApplication, User as UserType } from "@shared/schema";

type ApplicationWithUser = MembershipApplication & {
  user?: UserType;
};

export default function MembershipApplicationsManagement() {
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithUser | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const { data: pendingApplications, isLoading: pendingLoading } = useQuery<ApplicationWithUser[]>({
    queryKey: ["/api/admin/membership-applications", "PENDING"],
    queryFn: async () => {
      const res = await fetch("/api/admin/membership-applications?status=PENDING", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: approvedApplications, isLoading: approvedLoading } = useQuery<ApplicationWithUser[]>({
    queryKey: ["/api/admin/membership-applications", "APPROVED"],
    queryFn: async () => {
      const res = await fetch("/api/admin/membership-applications?status=APPROVED", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: rejectedApplications, isLoading: rejectedLoading } = useQuery<ApplicationWithUser[]>({
    queryKey: ["/api/admin/membership-applications", "REJECTED"],
    queryFn: async () => {
      const res = await fetch("/api/admin/membership-applications?status=REJECTED", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest("POST", `/api/admin/membership-applications/${id}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/membership-applications"] });
      toast({ title: "Application approved", description: "Membership has been activated and user notified." });
      setIsApproveDialogOpen(false);
      setSelectedApplication(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to approve application", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest("POST", `/api/admin/membership-applications/${id}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/membership-applications"] });
      toast({ title: "Application rejected", description: "User has been notified." });
      setIsRejectDialogOpen(false);
      setSelectedApplication(null);
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reject application", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const viewApplicationDetails = async (application: ApplicationWithUser) => {
    try {
      const res = await fetch(`/api/admin/membership-applications/${application.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSelectedApplication(data);
        setIsDetailDialogOpen(true);
      }
    } catch (error) {
      toast({ title: "Failed to load application details", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "N/A";
    return `PKR ${amount.toLocaleString()}`;
  };

  const renderApplicationsTable = (applications: ApplicationWithUser[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!applications || applications.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No applications found
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Applicant</TableHead>
            <TableHead>Tier Requested</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Payment Proof</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{app.user?.firstName || ''} {app.user?.lastName || ''}</span>
                </div>
                <div className="text-xs text-muted-foreground">{app.user?.email}</div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{app.tierDesired}</Badge>
              </TableCell>
              <TableCell>{formatCurrency(app.paymentAmount)}</TableCell>
              <TableCell>{app.paymentMethod || "N/A"}</TableCell>
              <TableCell>
                {app.paymentProofUrl ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => app.paymentProofUrl && window.open(app.paymentProofUrl, "_blank")}
                    data-testid={`button-view-proof-${app.id}`}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No proof
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {app.createdAt ? format(new Date(app.createdAt), "MMM d, yyyy") : "N/A"}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(app.status || "PENDING")}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => viewApplicationDetails(app)}
                    data-testid={`button-view-application-${app.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {app.status === "PENDING" && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-green-600"
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsApproveDialogOpen(true);
                        }}
                        data-testid={`button-approve-${app.id}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-600"
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsRejectDialogOpen(true);
                        }}
                        data-testid={`button-reject-${app.id}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <AdminLayout title="Membership Applications">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Membership Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending
                {pendingApplications && pendingApplications.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {renderApplicationsTable(pendingApplications, pendingLoading)}
            </TabsContent>

            <TabsContent value="approved">
              {renderApplicationsTable(approvedApplications, approvedLoading)}
            </TabsContent>

            <TabsContent value="rejected">
              {renderApplicationsTable(rejectedApplications, rejectedLoading)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Applicant</label>
                  <p className="font-medium">{selectedApplication.user?.firstName} {selectedApplication.user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedApplication.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status || "PENDING")}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Requested Tier</label>
                  <p className="font-medium">{selectedApplication.tierDesired}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Amount</label>
                  <p className="font-medium">{formatCurrency(selectedApplication.paymentAmount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="font-medium">{selectedApplication.paymentMethod || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Reference</label>
                  <p className="font-medium">{selectedApplication.paymentReference || "N/A"}</p>
                </div>
              </div>

              {selectedApplication.paymentProofUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Proof</label>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => selectedApplication.paymentProofUrl && window.open(selectedApplication.paymentProofUrl, "_blank")}
                      data-testid="button-view-proof-detail"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Payment Proof
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {selectedApplication.adminNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedApplication.adminNotes}</p>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <label className="font-medium">Submitted</label>
                <p>{selectedApplication.createdAt ? format(new Date(selectedApplication.createdAt), "PPpp") : "N/A"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              This will activate a {selectedApplication?.tierDesired} membership for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="mt-1"
                data-testid="input-approve-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedApplication && approveMutation.mutate({ id: selectedApplication.id, notes: adminNotes })}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-approve"
            >
              {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain why this application is being rejected..."
                className="mt-1"
                data-testid="input-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedApplication && rejectMutation.mutate({ id: selectedApplication.id, notes: adminNotes })}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
