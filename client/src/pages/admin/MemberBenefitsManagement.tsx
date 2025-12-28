import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Gift, Loader2, Clock, Award, Shield, Target, Zap, Heart, Ticket, Calendar, Trophy, Star, Crown, Users, Check, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdminLayout } from "./AdminLayout";
import type { MemberBenefit } from "@shared/schema";

const iconOptions = [
  { value: "clock", label: "Clock", icon: Clock },
  { value: "gift", label: "Gift", icon: Gift },
  { value: "award", label: "Award", icon: Award },
  { value: "shield", label: "Shield", icon: Shield },
  { value: "target", label: "Target", icon: Target },
  { value: "zap", label: "Zap", icon: Zap },
  { value: "heart", label: "Heart", icon: Heart },
  { value: "ticket", label: "Ticket", icon: Ticket },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "trophy", label: "Trophy", icon: Trophy },
  { value: "star", label: "Star", icon: Star },
  { value: "crown", label: "Crown", icon: Crown },
  { value: "users", label: "Users", icon: Users },
  { value: "check", label: "Check", icon: Check },
];

const getIconComponent = (iconName: string) => {
  const found = iconOptions.find(opt => opt.value === iconName.toLowerCase());
  return found?.icon || HelpCircle;
};

const tierOptions = [
  { value: "__all__", label: "All Members (General)" },
  { value: "FOUNDING", label: "Founding Members" },
  { value: "GOLD", label: "Gold Members" },
  { value: "SILVER", label: "Silver Members" },
  { value: "GUEST", label: "Pay-to-Play" },
];

const benefitSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  tierId: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

type BenefitFormData = z.infer<typeof benefitSchema>;

export default function MemberBenefitsManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberBenefit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: benefits = [], isLoading } = useQuery<MemberBenefit[]>({
    queryKey: ["/api/admin/member-benefits"],
  });

  const form = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      icon: "gift",
      title: "",
      description: "",
      tierId: "",
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BenefitFormData) => {
      return await apiRequest("POST", "/api/admin/member-benefits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/member-benefits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member-benefits"] });
      toast({ title: "Benefit created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BenefitFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/member-benefits/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/member-benefits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member-benefits"] });
      toast({ title: "Benefit updated successfully" });
      setDialogOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/member-benefits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/member-benefits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member-benefits"] });
      toast({ title: "Benefit deleted successfully" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (benefit: MemberBenefit) => {
    setEditing(benefit);
    form.reset({
      icon: benefit.icon || "gift",
      title: benefit.title,
      description: benefit.description || "",
      tierId: benefit.tierId || "",
      sortOrder: benefit.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: BenefitFormData) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Member Benefits">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const sortedBenefits = [...benefits].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <AdminLayout title="Member Benefits">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-member-benefits-title">Member Benefits</h1>
            <p className="text-muted-foreground">Manage membership benefit cards displayed on the membership page</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-benefit">
                <Plus className="w-4 h-4 mr-2" />
                Add Benefit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Benefit" : "Add Benefit"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-benefit-icon">
                              <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iconOptions.map((opt) => {
                              const Icon = opt.icon;
                              return (
                                <SelectItem key={opt.value} value={opt.value} data-testid={`select-icon-${opt.value}`}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    <span>{opt.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Priority Booking" data-testid="input-benefit-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Brief description of this benefit" rows={3} data-testid="input-benefit-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Tier</FormLabel>
                        <Select onValueChange={(val) => field.onChange(val === "__all__" ? null : val)} value={field.value || "__all__"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-benefit-tier">
                              <SelectValue placeholder="Select tier (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tierOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} data-testid={`select-tier-${opt.value}`}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-benefit-sort-order" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-benefit">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editing ? "Update" : "Create"} Benefit
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {sortedBenefits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Member Benefits</h3>
              <p className="text-muted-foreground mb-4">Add benefits to display on the membership page.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedBenefits.map((benefit) => {
              const Icon = getIconComponent(benefit.icon);
              return (
                <Card key={benefit.id} data-testid={`card-benefit-${benefit.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(benefit)} data-testid={`button-edit-benefit-${benefit.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                          setDeleteTarget(benefit.id);
                          setDeleteDialogOpen(true);
                        }} data-testid={`button-delete-benefit-${benefit.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-base mb-1">{benefit.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {benefit.tierId && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          {tierOptions.find(t => t.value === benefit.tierId)?.label || benefit.tierId}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">Sort: {benefit.sortOrder || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the member benefit. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
