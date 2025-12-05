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
import { Plus, Pencil, Trash2, Save, Image as ImageIcon, Upload, Loader2, CheckCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SiteImage } from "@shared/schema";

const PAGE_OPTIONS = [
  { value: "landing", label: "Landing Page" },
  { value: "facilities", label: "Facilities" },
  { value: "coming-soon", label: "Coming Soon" },
  { value: "about", label: "About Page" },
  { value: "contact", label: "Contact Page" },
  { value: "events", label: "Events Page" },
];

const SECTION_OPTIONS: Record<string, { value: string; label: string; dimensions: string }[]> = {
  landing: [
    { value: "hero", label: "Hero Background", dimensions: "1920x1080" },
    { value: "gallery-1", label: "Gallery Image 1", dimensions: "800x600" },
    { value: "gallery-2", label: "Gallery Image 2", dimensions: "800x600" },
    { value: "gallery-3", label: "Gallery Image 3", dimensions: "800x600" },
    { value: "about-bg", label: "About Section Background", dimensions: "1200x800" },
  ],
  facilities: [
    { value: "padel-tennis", label: "Padel Tennis Header", dimensions: "1920x600" },
    { value: "squash", label: "Squash Courts Header", dimensions: "1920x600" },
    { value: "air-rifle-range", label: "Air Rifle Range Header", dimensions: "1920x600" },
    { value: "bridge-room", label: "Bridge Room Header", dimensions: "1920x600" },
    { value: "multipurpose-hall", label: "Multipurpose Hall Header", dimensions: "1920x600" },
  ],
  "coming-soon": [
    { value: "hero", label: "Coming Soon Hero", dimensions: "1920x1080" },
    { value: "countdown-bg", label: "Countdown Background", dimensions: "1920x600" },
  ],
  about: [
    { value: "hero", label: "About Hero", dimensions: "1920x600" },
    { value: "team", label: "Team Section Background", dimensions: "1200x800" },
  ],
  contact: [
    { value: "hero", label: "Contact Hero", dimensions: "1920x400" },
    { value: "map-bg", label: "Map Background", dimensions: "1200x600" },
  ],
  events: [
    { value: "hero", label: "Events Hero", dimensions: "1920x600" },
    { value: "academy-bg", label: "Academy Section", dimensions: "1200x600" },
  ],
};

export default function SiteImagesManagement() {
  const { toast } = useToast();
  const [editingImage, setEditingImage] = useState<SiteImage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    key: "",
    imageUrl: "",
    alt: "",
    title: "",
    description: "",
    page: "landing",
    section: "",
    dimensions: "",
    isActive: true,
    sortOrder: 0,
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

  const { data: images, isLoading } = useQuery<SiteImage[]>({
    queryKey: ["/api/admin/site-images"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest('POST', '/api/admin/site-images', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-images"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Site image added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add site image", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => 
      apiRequest('PATCH', `/api/admin/site-images/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-images"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Site image updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update site image", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/site-images/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-images"] });
      toast({ title: "Site image deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete site image", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      key: "",
      imageUrl: "",
      alt: "",
      title: "",
      description: "",
      page: "landing",
      section: "",
      dimensions: "",
      isActive: true,
      sortOrder: 0,
    });
    setEditingImage(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (image: SiteImage) => {
    setEditingImage(image);
    setFormData({
      key: image.key,
      imageUrl: image.imageUrl,
      alt: image.alt || "",
      title: image.title || "",
      description: image.description || "",
      page: image.page,
      section: image.section || "",
      dimensions: image.dimensions || "",
      isActive: image.isActive ?? true,
      sortOrder: image.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.key || !formData.imageUrl || !formData.page) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the key, image URL, and page.",
        variant: "destructive",
      });
      return;
    }

    if (editingImage) {
      updateMutation.mutate({ id: editingImage.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePageChange = (page: string) => {
    setFormData(prev => ({ ...prev, page, section: "" }));
  };

  const handleSectionChange = (section: string) => {
    const sectionInfo = SECTION_OPTIONS[formData.page]?.find(s => s.value === section);
    setFormData(prev => ({ 
      ...prev, 
      section, 
      dimensions: sectionInfo?.dimensions || "",
      key: !editingImage ? `${formData.page}_${section}` : prev.key,
    }));
  };

  const getPageBadge = (page: string) => {
    const pageInfo = PAGE_OPTIONS.find(p => p.value === page);
    const colors: Record<string, string> = {
      landing: "bg-blue-500",
      facilities: "bg-green-500",
      "coming-soon": "bg-purple-500",
      about: "bg-amber-500",
      contact: "bg-teal-500",
      events: "bg-rose-500",
    };
    return <Badge className={colors[page] || "bg-gray-500"}>{pageInfo?.label || page}</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Site Images">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const groupedImages = images?.reduce((acc, img) => {
    const page = img.page || "other";
    if (!acc[page]) acc[page] = [];
    acc[page].push(img);
    return acc;
  }, {} as Record<string, SiteImage[]>) || {};

  return (
    <AdminLayout title="Site Images">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Site Images Management</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manage all website images from a central location. Upload and update images for the landing page, facility pages, coming soon pages, and more.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-blue-500/20 rounded">Landing: {groupedImages.landing?.length || 0}</span>
                <span className="px-2 py-1 bg-green-500/20 rounded">Facilities: {groupedImages.facilities?.length || 0}</span>
                <span className="px-2 py-1 bg-purple-500/20 rounded">Coming Soon: {groupedImages["coming-soon"]?.length || 0}</span>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-site-image">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Site Image
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingImage ? "Edit Site Image" : "Add New Site Image"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="page">Page *</Label>
                      <Select
                        value={formData.page}
                        onValueChange={handlePageChange}
                      >
                        <SelectTrigger data-testid="select-site-image-page">
                          <SelectValue placeholder="Select page" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={formData.section}
                        onValueChange={handleSectionChange}
                      >
                        <SelectTrigger data-testid="select-site-image-section">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTION_OPTIONS[formData.page]?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label} ({opt.dimensions})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key">Unique Key *</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      placeholder="e.g., landing_hero"
                      disabled={!!editingImage}
                      data-testid="input-site-image-key"
                    />
                    <p className="text-xs text-muted-foreground">This key is used to reference the image in the code.</p>
                  </div>

                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload File</TabsTrigger>
                      <TabsTrigger value="url">Use URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="space-y-2 mt-4">
                      <Label htmlFor="imageUrl">Image URL *</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                        data-testid="input-site-image-url"
                      />
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
                            >
                              Upload Different Image
                            </Button>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="font-medium mb-1">Click to Upload Image</p>
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

                  {formData.dimensions && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <Info className="w-4 h-4 text-blue-500" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Recommended dimensions: <strong>{formData.dimensions}</strong>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Image title"
                        data-testid="input-site-image-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alt">Alt Text</Label>
                      <Input
                        id="alt"
                        value={formData.alt}
                        onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                        placeholder="Image description for accessibility"
                        data-testid="input-site-image-alt"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      data-testid="input-site-image-description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sortOrder">Sort Order</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        data-testid="input-site-image-sort"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-site-image"
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

        {Object.keys(groupedImages).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center mb-8">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Site Images Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Upload images to customize the look of your website. Images can be used for hero backgrounds, 
                  facility headers, gallery sections, and more.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-image">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Image
                </Button>
              </div>
              
              <div className="border-t pt-8 mt-8">
                <h4 className="font-semibold text-center mb-6">Where Images Can Be Used</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Landing Page</h5>
                    <p className="text-sm text-muted-foreground">Hero background, gallery images, about section</p>
                    <p className="text-xs text-blue-500 mt-2">Recommended: 1920x1080 for hero</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">Facilities</h5>
                    <p className="text-sm text-muted-foreground">Headers for each sport facility page</p>
                    <p className="text-xs text-green-500 mt-2">Recommended: 1920x600</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h5 className="font-medium text-purple-700 dark:text-purple-300 mb-1">Coming Soon</h5>
                    <p className="text-sm text-muted-foreground">Hero and countdown backgrounds</p>
                    <p className="text-xs text-purple-500 mt-2">Recommended: 1920x1080</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h5 className="font-medium text-amber-700 dark:text-amber-300 mb-1">About Page</h5>
                    <p className="text-sm text-muted-foreground">About hero and team section</p>
                    <p className="text-xs text-amber-500 mt-2">Recommended: 1920x600</p>
                  </div>
                  <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
                    <h5 className="font-medium text-teal-700 dark:text-teal-300 mb-1">Contact Page</h5>
                    <p className="text-sm text-muted-foreground">Contact hero and map background</p>
                    <p className="text-xs text-teal-500 mt-2">Recommended: 1920x400</p>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <h5 className="font-medium text-rose-700 dark:text-rose-300 mb-1">Events Page</h5>
                    <p className="text-sm text-muted-foreground">Events hero and academy section</p>
                    <p className="text-xs text-rose-500 mt-2">Recommended: 1920x600</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-8 mt-8 text-center">
                <h4 className="font-semibold mb-4">How It Works</h4>
                <div className="flex flex-col md:flex-row justify-center gap-6 text-sm text-muted-foreground max-w-2xl mx-auto">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">1</span>
                    </div>
                    <span>Click "Add Site Image" and select a page and section</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">2</span>
                    </div>
                    <span>Upload your image or paste a URL</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-xs">3</span>
                    </div>
                    <span>Save and it appears on your website instantly</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedImages).map(([page, pageImages]) => (
            <div key={page} className="space-y-4">
              <div className="flex items-center gap-2">
                {getPageBadge(page)}
                <span className="text-sm text-muted-foreground">({pageImages.length} images)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pageImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden" data-testid={`card-site-image-${image.id}`}>
                    <div className="relative aspect-video bg-muted">
                      {image.imageUrl ? (
                        <img 
                          src={image.imageUrl} 
                          alt={image.alt || image.title || "Site image"} 
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
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{image.title || image.key}</h3>
                          <p className="text-xs text-muted-foreground font-mono truncate">{image.key}</p>
                          {image.section && (
                            <p className="text-xs text-muted-foreground mt-1">{image.section}</p>
                          )}
                          {image.dimensions && (
                            <p className="text-xs text-blue-500 mt-1">{image.dimensions}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEdit(image)}
                          data-testid={`button-edit-site-image-${image.id}`}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(image.id)}
                          data-testid={`button-delete-site-image-${image.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
