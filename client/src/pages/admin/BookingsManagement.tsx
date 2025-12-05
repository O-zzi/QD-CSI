import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Check, X, Clock, AlertCircle, Eye, Search, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Booking } from "@shared/schema";

type PaymentStatus = "PENDING_PAYMENT" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export default function BookingsManagement() {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { paymentStatus?: PaymentStatus; paymentNotes?: string; status?: BookingStatus } }) => {
      return await apiRequest("PATCH", `/api/admin/bookings/${id}/payment`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking updated successfully" });
      setIsDetailDialogOpen(false);
      setSelectedBooking(null);
      setPaymentNotes("");
    },
    onError: () => {
      toast({ title: "Failed to update booking", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      return await apiRequest("PATCH", `/api/admin/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const handleVerifyPayment = () => {
    if (!selectedBooking) return;
    updatePaymentMutation.mutate({
      id: selectedBooking.id,
      data: {
        paymentStatus: "VERIFIED",
        paymentNotes,
      },
    });
  };

  const handleRejectPayment = () => {
    if (!selectedBooking) return;
    updatePaymentMutation.mutate({
      id: selectedBooking.id,
      data: {
        paymentStatus: "REJECTED",
        paymentNotes,
      },
    });
  };

  const getPaymentStatusBadge = (status: string | null) => {
    switch (status) {
      case "VERIFIED":
        return <Badge variant="default" className="bg-green-600">Verified</Badge>;
      case "PENDING_VERIFICATION":
        return <Badge variant="default" className="bg-yellow-600">Pending Verification</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "PENDING_PAYMENT":
      default:
        return <Badge variant="secondary">Awaiting Payment</Badge>;
    }
  };

  const getBookingStatusBadge = (status: string | null, paymentStatus: string | null) => {
    if (status === "CONFIRMED" && paymentStatus === "VERIFIED") {
      return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
    }
    if (status === "CANCELLED") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (paymentStatus === "VERIFIED" && status !== "CONFIRMED") {
      return <Badge variant="default" className="bg-blue-600">Payment Verified</Badge>;
    }
    if (paymentStatus === "PENDING_VERIFICATION") {
      return <Badge variant="default" className="bg-amber-500">Tentative - Awaiting Verification</Badge>;
    }
    return <Badge variant="secondary">Tentative - Awaiting Payment</Badge>;
  };

  const filteredBookings = bookings?.filter((booking) => {
    const matchesSearch = 
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.facilityId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPayment = paymentFilter === "all" || booking.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const pendingVerificationCount = bookings?.filter(b => b.paymentStatus === "PENDING_VERIFICATION").length || 0;

  if (isLoading) {
    return (
      <AdminLayout title="Bookings Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Bookings Management">
      <div className="space-y-6">
        {pendingVerificationCount > 0 && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                {pendingVerificationCount} booking{pendingVerificationCount > 1 ? 's' : ''} pending payment verification
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPaymentFilter("PENDING_VERIFICATION")}
                className="ml-auto"
                data-testid="button-show-pending"
              >
                Show Pending
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              All Bookings ({bookings?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, facility, or user..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-bookings"
                  />
                </div>
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-payment-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">Awaiting Payment</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredBookings && filteredBookings.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Date / Time</TableHead>
                      <TableHead>Facility</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                        <TableCell className="font-mono text-xs">
                          {booking.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{booking.date}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.startTime} - {booking.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{booking.facilityId}</div>
                          <div className="text-xs text-muted-foreground">
                            Resource #{booking.resourceId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            PKR {booking.totalPrice?.toLocaleString() || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(booking.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          {getBookingStatusBadge(booking.status, booking.paymentStatus)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setPaymentNotes(booking.paymentNotes || "");
                              setIsDetailDialogOpen(true);
                            }}
                            data-testid={`button-view-${booking.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found matching your filters.
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Booking ID</Label>
                    <p className="font-mono text-sm">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="font-mono text-sm">{selectedBooking.userId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="font-medium">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Facility</Label>
                    <p className="font-medium">{selectedBooking.facilityId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Resource</Label>
                    <p className="font-medium">#{selectedBooking.resourceId}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Amount</Label>
                    <p className="font-bold text-lg">PKR {selectedBooking.totalPrice?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Payment Method</Label>
                    <p className="font-medium capitalize">{selectedBooking.paymentMethod?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment Status</Label>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.paymentStatus)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Booking Status</Label>
                      <div className="mt-1">{getBookingStatusBadge(selectedBooking.status, selectedBooking.paymentStatus)}</div>
                    </div>
                  </div>

                  {selectedBooking.paymentProofUrl && (
                    <div className="mb-4">
                      <Label className="text-xs text-muted-foreground">Payment Proof</Label>
                      <a 
                        href={selectedBooking.paymentProofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm block mt-1"
                      >
                        View Proof Document
                      </a>
                    </div>
                  )}

                  {selectedBooking.paymentVerifiedBy && (
                    <div className="mb-4 text-sm text-muted-foreground">
                      Verified by: {selectedBooking.paymentVerifiedBy}
                      {selectedBooking.paymentVerifiedAt && (
                        <> on {format(new Date(selectedBooking.paymentVerifiedAt), 'PPp')}</>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="paymentNotes">Admin Notes</Label>
                    <Textarea
                      id="paymentNotes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Add notes about payment verification..."
                      rows={3}
                      data-testid="textarea-payment-notes"
                    />
                  </div>
                </div>

                {(selectedBooking.paymentStatus === "PENDING_VERIFICATION" || selectedBooking.paymentStatus === "PENDING_PAYMENT") && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={handleVerifyPayment}
                      disabled={updatePaymentMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-500"
                      data-testid="button-verify-payment"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Verify Payment
                    </Button>
                    <Button
                      onClick={handleRejectPayment}
                      disabled={updatePaymentMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                      data-testid="button-reject-payment"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {selectedBooking.paymentStatus === "VERIFIED" && selectedBooking.status !== "CANCELLED" && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedBooking.id, status: "CANCELLED" });
                        setIsDetailDialogOpen(false);
                      }}
                      disabled={updateStatusMutation.isPending}
                      variant="destructive"
                      data-testid="button-cancel-booking"
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
