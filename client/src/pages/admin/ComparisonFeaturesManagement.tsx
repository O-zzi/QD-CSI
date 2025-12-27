import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, LayoutGrid, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminLayout } from "./AdminLayout";
import type { ComparisonFeature } from "@shared/schema";

const featureSchema = z.object({
  feature: z.string().min(1, "Feature name is required"),
  foundingValue: z.string().optional(),
  goldValue: z.string().optional(),
  silverValue: z.string().optional(),
  guestValue: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export default function ComparisonFeaturesManagement() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ComparisonFeature | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: features = [], isLoading } = useQuery<ComparisonFeature[]>({
    queryKey: ["/api/admin/comparison-features"],
  });

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      feature: "",
      foundingValue: "",
      goldValue: "",
      silverValue: "",
      guestValue: "",
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FeatureFormData) => {
      return await apiRequest("POST", "/api/admin/comparison-features", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comparison-features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/comparison-features"] });
      toast({ title: "Feature created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FeatureFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/comparison-features/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comparison-features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/comparison-features"] });
      toast({ title: "Feature updated successfully" });
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
      return await apiRequest("DELETE", `/api/admin/comparison-features/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comparison-features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/comparison-features"] });
      toast({ title: "Feature deleted successfully" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (feature: ComparisonFeature) => {
    setEditing(feature);
    form.reset({
      feature: feature.feature,
      foundingValue: feature.foundingValue || "",
      goldValue: feature.goldValue || "",
      silverValue: feature.silverValue || "",
      guestValue: feature.guestValue || "",
      sortOrder: feature.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: FeatureFormData) => {
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
      <AdminLayout title="Comparison Features">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const sortedFeatures = [...features].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <AdminLayout title="Comparison Features">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-comparison-features-title">Comparison Features</h1>
            <p className="text-muted-foreground">Manage membership tier comparison table features</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-feature">
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Feature" : "Add Feature"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="feature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feature Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Advance Booking Window" data-testid="input-feature-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="foundingValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founding Member Value</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 14 days" data-testid="input-founding-value" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="goldValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gold Member Value</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 7 days" data-testid="input-gold-value" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="silverValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Silver Member Value</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 5 days" data-testid="input-silver-value" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guestValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest Value</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., 2 days" data-testid="input-guest-value" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-sort-order" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-feature">
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editing ? "Update" : "Create"} Feature
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {sortedFeatures.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Comparison Features</h3>
              <p className="text-muted-foreground mb-4">Add features to display in the membership comparison table.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Features List</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-center">Founding</TableHead>
                    <TableHead className="text-center">Gold</TableHead>
                    <TableHead className="text-center">Silver</TableHead>
                    <TableHead className="text-center">Guest</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFeatures.map((feature) => (
                    <TableRow key={feature.id} data-testid={`row-feature-${feature.id}`}>
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-medium">{feature.feature}</TableCell>
                      <TableCell className="text-center">{feature.foundingValue || "-"}</TableCell>
                      <TableCell className="text-center">{feature.goldValue || "-"}</TableCell>
                      <TableCell className="text-center">{feature.silverValue || "-"}</TableCell>
                      <TableCell className="text-center">{feature.guestValue || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(feature)} data-testid={`button-edit-feature-${feature.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => {
                            setDeleteTarget(feature.id);
                            setDeleteDialogOpen(true);
                          }} data-testid={`button-delete-feature-${feature.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the comparison feature. This action cannot be undone.
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
