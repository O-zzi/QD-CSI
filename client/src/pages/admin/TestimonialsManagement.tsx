import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Save, Star, Quote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Testimonial, Facility } from "@shared/schema";

export default function TestimonialsManagement() {
  const { toast } = useToast();
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    company: "",
    avatarUrl: "",
    quote: "",
    rating: 5,
    facilityId: "",
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
  });

  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/testimonials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/featured"] });
      toast({ title: "Testimonial created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create testimonial", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/admin/testimonials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/featured"] });
      toast({ title: "Testimonial updated successfully" });
      setIsDialogOpen(false);
      setEditingTestimonial(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update testimonial", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/testimonials/featured"] });
      toast({ title: "Testimonial deleted successfully" });
      setDeletingId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete testimonial", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      company: "",
      avatarUrl: "",
      quote: "",
      rating: 5,
      facilityId: "",
      isFeatured: false,
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      title: testimonial.title || "",
      company: testimonial.company || "",
      avatarUrl: testimonial.avatarUrl || "",
      quote: testimonial.quote,
      rating: testimonial.rating || 5,
      facilityId: testimonial.facilityId || "",
      isFeatured: testimonial.isFeatured ?? false,
      isActive: testimonial.isActive ?? true,
      sortOrder: testimonial.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...formData,
      facilityId: formData.facilityId || null,
    };

    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <AdminLayout title="Testimonials Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Testimonials Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage customer testimonials and reviews displayed on the website.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTestimonial(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-testimonial">
                <Plus className="w-4 h-4 mr-2" /> Add Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add New Testimonial"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-testimonial-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title/Role</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Founding Member"
                    data-testid="input-testimonial-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    data-testid="input-testimonial-company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                  <Input
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    data-testid="input-testimonial-avatar"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="quote">Quote</Label>
                  <Textarea
                    id="quote"
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    rows={4}
                    data-testid="input-testimonial-quote"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Select
                    value={formData.rating.toString()}
                    onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                  >
                    <SelectTrigger data-testid="select-testimonial-rating">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <SelectItem key={r} value={r.toString()} data-testid={`select-rating-${r}`}>
                          {r} Star{r !== 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilityId">Associated Facility (Optional)</Label>
                  <Select
                    value={formData.facilityId}
                    onValueChange={(value) => setFormData({ ...formData, facilityId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger data-testid="select-testimonial-facility">
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" data-testid="select-facility-none">None</SelectItem>
                      {facilities?.map((f) => (
                        <SelectItem key={f.id} value={f.id} data-testid={`select-facility-${f.id}`}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    data-testid="input-testimonial-sortorder"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-testimonial-active"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                      data-testid="switch-testimonial-featured"
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-testimonial"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingTestimonial ? "Update" : "Create"} Testimonial
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {testimonials?.map((testimonial) => (
            <Card key={testimonial.id} data-testid={`card-testimonial-${testimonial.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.avatarUrl || undefined} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{testimonial.name}</h3>
                        {testimonial.isFeatured && (
                          <Badge variant="default" className="text-xs">Featured</Badge>
                        )}
                        {!testimonial.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      {(testimonial.title || testimonial.company) && (
                        <p className="text-sm text-muted-foreground">
                          {testimonial.title}{testimonial.title && testimonial.company ? " at " : ""}{testimonial.company}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {renderStars(testimonial.rating || 5)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(testimonial)}
                      data-testid={`button-edit-testimonial-${testimonial.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog open={deletingId === testimonial.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingId(testimonial.id)}
                          data-testid={`button-delete-testimonial-${testimonial.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the testimonial from "{testimonial.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(testimonial.id)}
                            disabled={deleteMutation.isPending}
                            data-testid="button-confirm-delete-testimonial"
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="mt-4 relative pl-4 border-l-2 border-muted">
                  <Quote className="absolute -left-2.5 -top-1 w-4 h-4 text-muted-foreground bg-card" />
                  <p className="text-sm italic text-muted-foreground">{testimonial.quote}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {!testimonials?.length && (
            <Card className="col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                No testimonials yet. Click "Add Testimonial" to create your first one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
