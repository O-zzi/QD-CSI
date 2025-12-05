import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Save, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { GalleryImage } from "@shared/schema";

export default function GalleryManagement() {
  const { toast } = useToast();
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    imageUrl: "",
    title: "",
    description: "",
    category: "Construction",
    sortOrder: 0,
    isActive: true,
  });

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/admin/gallery"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/gallery", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Gallery image added successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to add gallery image", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/gallery/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Gallery image updated successfully" });
      setIsDialogOpen(false);
      setEditingImage(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update gallery image", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/gallery/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gallery"] });
      toast({ title: "Gallery image deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete gallery image", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      imageUrl: "",
      title: "",
      description: "",
      category: "Construction",
      sortOrder: 0,
      isActive: true,
    });
  };

  const handleEdit = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      imageUrl: image.imageUrl,
      title: image.title || "",
      description: image.description || "",
      category: image.category || "Construction",
      sortOrder: image.sortOrder || 0,
      isActive: image.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingImage) {
      updateMutation.mutate({ id: editingImage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryBadge = (category: string | null) => {
    switch (category) {
      case "Renders":
        return <Badge className="bg-purple-500">Renders</Badge>;
      case "Construction":
        return <Badge className="bg-orange-500">Construction</Badge>;
      case "Facilities":
        return <Badge className="bg-blue-500">Facilities</Badge>;
      default:
        return <Badge variant="secondary">{category || "Other"}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Gallery">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gallery">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage gallery images shown on the website.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingImage(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-gallery-image">
                <Plus className="w-4 h-4 mr-2" /> Add Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingImage ? "Edit Image" : "Add New Image"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    data-testid="input-gallery-url"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 rounded-md overflow-hidden border">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      data-testid="input-gallery-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-gallery-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Renders">Renders</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Facilities">Facilities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    data-testid="input-gallery-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    data-testid="input-gallery-sort"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (visible on website)</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-gallery-image"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingImage ? "Update" : "Add"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {images?.map((image) => (
            <Card key={image.id} className="overflow-hidden" data-testid={`card-gallery-${image.id}`}>
              <div className="relative aspect-video bg-muted">
                {image.imageUrl ? (
                  <img 
                    src={image.imageUrl} 
                    alt={image.title || "Gallery image"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                {!image.isActive && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">Hidden</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-medium truncate">{image.title || "Untitled"}</h3>
                    <p className="text-sm text-muted-foreground truncate">{image.description || "No description"}</p>
                  </div>
                  {getCategoryBadge(image.category)}
                </div>
                <div className="flex justify-end gap-1 mt-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(image)}
                    data-testid={`button-edit-gallery-${image.id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this image?")) {
                        deleteMutation.mutate(image.id);
                      }
                    }}
                    data-testid={`button-delete-gallery-${image.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!images || images.length === 0) && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No gallery images found. Add your first image to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
