import { useState, useRef } from "react";
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
import { Plus, Pencil, Trash2, Save, Image as ImageIcon, Info, Upload, Link as LinkIcon, HelpCircle, Loader2, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GalleryImage } from "@shared/schema";

const IMAGE_GUIDELINES = {
  dimensions: {
    recommended: "1920 x 1080 px (16:9 aspect ratio)",
    minimum: "1280 x 720 px",
    maximum: "4096 x 2160 px",
  },
  formats: ["JPEG", "PNG", "WebP"],
  maxFileSize: "5 MB",
  categories: {
    Renders: "3D architectural renders and concept designs for The Quarterdeck complex",
    Construction: "Progress photos from the construction site showing different phases",
    Facilities: "Photos of completed or in-progress facilities (courts, halls, etc.)",
  },
};

export default function GalleryManagement() {
  const { toast } = useToast();
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    imageUrl: "",
    title: "",
    description: "",
    category: "Construction",
    sortOrder: 0,
    isActive: true,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      setUploadedFile({ name: file.name, url: result.imageUrl });
      setFormData(prev => ({ ...prev, imageUrl: result.imageUrl }));
      
      toast({
        title: "Upload successful",
        description: "Your image has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const renderCount = images?.filter(i => i.category === "Renders").length || 0;
  const constructionCount = images?.filter(i => i.category === "Construction").length || 0;
  const facilitiesCount = images?.filter(i => i.category === "Facilities").length || 0;
  const activeCount = images?.filter(i => i.isActive).length || 0;
  const hiddenCount = images?.filter(i => !i.isActive).length || 0;

  return (
    <AdminLayout title="Gallery">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500/10 via-orange-500/10 to-blue-500/10 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Gallery Management</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manage gallery images shown on the website. Images should be high-quality and relevant to The Quarterdeck.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm">{renderCount} Renders</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">{constructionCount} Construction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">{facilitiesCount} Facilities</span>
                </div>
                <div className="border-l pl-3 flex items-center gap-2">
                  <span className="text-sm text-green-600 dark:text-green-400">{activeCount} Active</span>
                  {hiddenCount > 0 && (
                    <span className="text-sm text-muted-foreground">/ {hiddenCount} Hidden</span>
                  )}
                </div>
              </div>
            </div>
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingImage ? "Edit Image" : "Add New Image"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">Image Guidelines</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-blue-700 dark:text-blue-400">
                        <div>
                          <span className="font-medium">Recommended:</span>
                          <p className="text-xs">{IMAGE_GUIDELINES.dimensions.recommended}</p>
                        </div>
                        <div>
                          <span className="font-medium">Formats:</span>
                          <p className="text-xs">{IMAGE_GUIDELINES.formats.join(", ")}</p>
                        </div>
                        <div>
                          <span className="font-medium">Max Size:</span>
                          <p className="text-xs">{IMAGE_GUIDELINES.maxFileSize}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2" data-testid="tab-url">
                      <LinkIcon className="w-4 h-4" /> URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="tab-upload">
                      <Upload className="w-4 h-4" /> Upload (Testing)
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        data-testid="input-gallery-url"
                      />
                      <p className="text-xs text-muted-foreground">
                        Paste a direct link to your image. Supports any publicly accessible URL.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        uploadedFile 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-muted/50'
                      }`}
                      onClick={() => !isUploading && fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
                          <p className="font-medium mb-1">Uploading...</p>
                          <p className="text-sm text-muted-foreground">Please wait while your image is being uploaded.</p>
                        </>
                      ) : uploadedFile ? (
                        <>
                          <CheckCircle className="w-12 h-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
                          <p className="font-medium mb-1 text-green-700 dark:text-green-300">Upload Complete</p>
                          <p className="text-sm text-muted-foreground mb-2">{uploadedFile.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                              setFormData(prev => ({ ...prev, imageUrl: '' }));
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            data-testid="button-clear-upload"
                          >
                            Upload Different Image
                          </Button>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="font-medium mb-1">Click to Upload Image</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Drag and drop or click to browse
                          </p>
                          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                            <span className="px-2 py-1 bg-muted rounded">JPEG</span>
                            <span className="px-2 py-1 bg-muted rounded">PNG</span>
                            <span className="px-2 py-1 bg-muted rounded">WebP</span>
                            <span className="px-2 py-1 bg-muted rounded">Max 5MB</span>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                {formData.imageUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="rounded-md overflow-hidden border aspect-video bg-muted">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Padel Court Construction - Week 12"
                      data-testid="input-gallery-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2 text-xs">
                            <p><strong>Renders:</strong> {IMAGE_GUIDELINES.categories.Renders}</p>
                            <p><strong>Construction:</strong> {IMAGE_GUIDELINES.categories.Construction}</p>
                            <p><strong>Facilities:</strong> {IMAGE_GUIDELINES.categories.Facilities}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-gallery-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Renders">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            Renders
                          </div>
                        </SelectItem>
                        <SelectItem value="Construction">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            Construction
                          </div>
                        </SelectItem>
                        <SelectItem value="Facilities">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Facilities
                          </div>
                        </SelectItem>
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
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-gallery-image"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingImage ? "Update" : "Add"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
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
