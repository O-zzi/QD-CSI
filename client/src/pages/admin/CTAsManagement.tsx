import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, MousePointer, Eye, EyeOff, Loader2, Upload, ChevronDown, ChevronUp, Plus, Trash2, Link } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Cta } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STYLE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "With Image" },
  { value: "minimal", label: "Minimal" },
];

const PAGE_OPTIONS = [
  { value: "landing", label: "Landing Page" },
  { value: "facilities", label: "Facilities" },
  { value: "membership", label: "Membership" },
  { value: "events", label: "Events" },
  { value: "contact", label: "Contact" },
  { value: "footer", label: "Footer" },
  { value: "global", label: "Global (All Pages)" },
];

export default function CTAsManagement() {
  const { toast } = useToast();
  const [expandedCta, setExpandedCta] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<Cta>>>({});
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newCta, setNewCta] = useState({
    key: "",
    title: "",
    subtitle: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    secondaryButtonText: "",
    secondaryButtonLink: "",
    page: "landing",
    section: "",
    style: "default",
    isActive: true,
  });

  const { data: ctas, isLoading } = useQuery<Cta[]>({
    queryKey: ["/api/admin/ctas"],
  });

  useEffect(() => {
    if (ctas) {
      const data: Record<string, Partial<Cta>> = {};
      ctas.forEach(cta => {
        data[cta.id] = { ...cta };
      });
      setEditData(data);
    }
  }, [ctas]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cta> }) => {
      return await apiRequest("PATCH", `/api/admin/ctas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ctas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ctas"] });
      toast({ title: "CTA updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update CTA", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCta) => {
      return await apiRequest("POST", "/api/admin/ctas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ctas"] });
      setShowNewDialog(false);
      setNewCta({
        key: "",
        title: "",
        subtitle: "",
        description: "",
        buttonText: "",
        buttonLink: "",
        secondaryButtonText: "",
        secondaryButtonLink: "",
        page: "landing",
        section: "",
        style: "default",
        isActive: true,
      });
      toast({ title: "CTA created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create CTA", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/ctas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ctas"] });
      toast({ title: "CTA deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete CTA", variant: "destructive" });
    },
  });

  const handleFileUpload = async (ctaId: string, file: File) => {
    setIsUploading(ctaId);
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      
      const result = await response.json();
      if (result.imageUrl) {
        setEditData(prev => ({
          ...prev,
          [ctaId]: { ...prev[ctaId], backgroundImageUrl: result.imageUrl }
        }));
        toast({ title: "Image uploaded successfully" });
      }
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message || "Failed to upload image",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(null);
    }
  };

  const updateField = (ctaId: string, field: keyof Cta, value: any) => {
    setEditData(prev => ({
      ...prev,
      [ctaId]: { ...prev[ctaId], [field]: value }
    }));
  };

  const saveCta = (ctaId: string) => {
    const data = editData[ctaId];
    if (data) {
      updateMutation.mutate({ id: ctaId, data });
    }
  };

  const toggleVisibility = (ctaId: string) => {
    const current = editData[ctaId]?.isActive ?? true;
    updateMutation.mutate({ id: ctaId, data: { isActive: !current } });
  };

  if (isLoading) {
    return (
      <AdminLayout title="CTAs">
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="CTAs">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Call-to-Action Buttons</h1>
            <p className="text-muted-foreground">
              Manage CTA buttons and links throughout the site. Edit button text, URLs, and styling.
            </p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-cta">
                <Plus className="h-4 w-4 mr-2" />
                Add CTA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New CTA</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Key (unique identifier)</Label>
                    <Input
                      value={newCta.key}
                      onChange={(e) => setNewCta({ ...newCta, key: e.target.value })}
                      placeholder="e.g., landing-membership"
                      data-testid="input-new-cta-key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Page</Label>
                    <Select 
                      value={newCta.page}
                      onValueChange={(value) => setNewCta({ ...newCta, page: value })}
                    >
                      <SelectTrigger data-testid="select-new-cta-page">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newCta.title}
                    onChange={(e) => setNewCta({ ...newCta, title: e.target.value })}
                    placeholder="CTA Title"
                    data-testid="input-new-cta-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={newCta.subtitle}
                    onChange={(e) => setNewCta({ ...newCta, subtitle: e.target.value })}
                    placeholder="Optional subtitle"
                    data-testid="input-new-cta-subtitle"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Button Text</Label>
                    <Input
                      value={newCta.buttonText}
                      onChange={(e) => setNewCta({ ...newCta, buttonText: e.target.value })}
                      placeholder="Get Started"
                      data-testid="input-new-cta-button-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Button Link</Label>
                    <Input
                      value={newCta.buttonLink}
                      onChange={(e) => setNewCta({ ...newCta, buttonLink: e.target.value })}
                      placeholder="/membership"
                      data-testid="input-new-cta-button-link"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Secondary Button Text</Label>
                    <Input
                      value={newCta.secondaryButtonText}
                      onChange={(e) => setNewCta({ ...newCta, secondaryButtonText: e.target.value })}
                      placeholder="Learn More"
                      data-testid="input-new-cta-secondary-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Button Link</Label>
                    <Input
                      value={newCta.secondaryButtonLink}
                      onChange={(e) => setNewCta({ ...newCta, secondaryButtonLink: e.target.value })}
                      placeholder="/about"
                      data-testid="input-new-cta-secondary-link"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select 
                    value={newCta.style}
                    onValueChange={(value) => setNewCta({ ...newCta, style: value })}
                  >
                    <SelectTrigger data-testid="select-new-cta-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => createMutation.mutate(newCta)}
                  disabled={!newCta.key || !newCta.title || createMutation.isPending}
                  className="w-full"
                  data-testid="button-create-cta"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create CTA
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {(!ctas || ctas.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <MousePointer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No CTAs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first call-to-action button to get started.
              </p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add CTA
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {ctas?.map(cta => {
            const isExpanded = expandedCta === cta.id;
            const data = editData[cta.id] || cta;
            const isActive = data.isActive ?? true;

            return (
              <Card key={cta.id} className={!isActive ? "opacity-60" : ""}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedCta(isExpanded ? null : cta.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <MousePointer className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {cta.title}
                          <Badge variant="outline" className="font-mono text-xs">
                            {cta.key}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{PAGE_OPTIONS.find(p => p.value === cta.page)?.label || cta.page}</span>
                          {cta.buttonLink && (
                            <span className="flex items-center gap-1 text-xs">
                              <Link className="h-3 w-3" />
                              {cta.buttonLink}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(cta.id);
                        }}
                        data-testid={`button-toggle-cta-${cta.key}`}
                      >
                        {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this CTA?")) {
                            deleteMutation.mutate(cta.id);
                          }
                        }}
                        data-testid={`button-delete-cta-${cta.key}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={data.title || ""}
                          onChange={(e) => updateField(cta.id, "title", e.target.value)}
                          data-testid={`input-cta-title-${cta.key}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={data.subtitle || ""}
                          onChange={(e) => updateField(cta.id, "subtitle", e.target.value)}
                          data-testid={`input-cta-subtitle-${cta.key}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={data.description || ""}
                        onChange={(e) => updateField(cta.id, "description", e.target.value)}
                        data-testid={`textarea-cta-description-${cta.key}`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Button Text</Label>
                        <Input
                          value={data.buttonText || ""}
                          onChange={(e) => updateField(cta.id, "buttonText", e.target.value)}
                          placeholder="e.g., Get Started"
                          data-testid={`input-cta-button-text-${cta.key}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary Button Link</Label>
                        <Input
                          value={data.buttonLink || ""}
                          onChange={(e) => updateField(cta.id, "buttonLink", e.target.value)}
                          placeholder="e.g., /membership"
                          data-testid={`input-cta-button-link-${cta.key}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Secondary Button Text</Label>
                        <Input
                          value={data.secondaryButtonText || ""}
                          onChange={(e) => updateField(cta.id, "secondaryButtonText", e.target.value)}
                          placeholder="e.g., Learn More"
                          data-testid={`input-cta-secondary-text-${cta.key}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Button Link</Label>
                        <Input
                          value={data.secondaryButtonLink || ""}
                          onChange={(e) => updateField(cta.id, "secondaryButtonLink", e.target.value)}
                          placeholder="e.g., /about"
                          data-testid={`input-cta-secondary-link-${cta.key}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Page</Label>
                        <Select 
                          value={data.page || "landing"}
                          onValueChange={(value) => updateField(cta.id, "page", value)}
                        >
                          <SelectTrigger data-testid={`select-cta-page-${cta.key}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Section</Label>
                        <Input
                          value={data.section || ""}
                          onChange={(e) => updateField(cta.id, "section", e.target.value)}
                          placeholder="e.g., header, footer"
                          data-testid={`input-cta-section-${cta.key}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select 
                          value={data.style || "default"}
                          onValueChange={(value) => updateField(cta.id, "style", value)}
                        >
                          <SelectTrigger data-testid={`select-cta-style-${cta.key}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STYLE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Image</Label>
                      <div className="flex gap-2">
                        <Input
                          value={data.backgroundImageUrl || ""}
                          onChange={(e) => updateField(cta.id, "backgroundImageUrl", e.target.value)}
                          placeholder="Image URL"
                          className="flex-1"
                          data-testid={`input-cta-bg-image-${cta.key}`}
                        />
                        <label>
                          <Button 
                            variant="outline" 
                            size="icon"
                            disabled={isUploading === cta.id}
                            asChild
                          >
                            <span>
                              {isUploading === cta.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(cta.id, file);
                            }}
                          />
                        </label>
                      </div>
                      {data.backgroundImageUrl && (
                        <div className="mt-2">
                          <img 
                            src={data.backgroundImageUrl} 
                            alt="CTA Background" 
                            className="h-24 w-48 object-cover rounded-md border"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <Input
                        value={data.backgroundColor || ""}
                        onChange={(e) => updateField(cta.id, "backgroundColor", e.target.value)}
                        placeholder="e.g., #1a1a1a or gradient"
                        data-testid={`input-cta-bg-color-${cta.key}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          onCheckedChange={(checked) => updateField(cta.id, "isActive", checked)}
                          data-testid={`switch-cta-active-${cta.key}`}
                        />
                        <Label>Active</Label>
                      </div>
                      <Button
                        onClick={() => saveCta(cta.id)}
                        disabled={updateMutation.isPending}
                        data-testid={`button-save-cta-${cta.key}`}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
