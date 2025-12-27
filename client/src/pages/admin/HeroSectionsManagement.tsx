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
import { Save, Image, Eye, EyeOff, Loader2, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { HeroSection } from "@shared/schema";

const PAGE_LABELS: Record<string, string> = {
  landing: "Landing Page",
  facilities: "Facilities",
  membership: "Membership",
  events: "Events",
  contact: "Contact",
  careers: "Careers",
  gallery: "Gallery",
  roadmap: "Roadmap",
  faq: "FAQ",
  rules: "Rules",
  leaderboard: "Leaderboard",
};

export default function HeroSectionsManagement() {
  const { toast } = useToast();
  const [expandedHero, setExpandedHero] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<HeroSection>>>({});
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const { data: heroSections, isLoading } = useQuery<HeroSection[]>({
    queryKey: ["/api/admin/hero-sections"],
  });

  useEffect(() => {
    if (heroSections) {
      const data: Record<string, Partial<HeroSection>> = {};
      heroSections.forEach(hero => {
        data[hero.id] = { ...hero };
      });
      setEditData(data);
    }
  }, [heroSections]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<HeroSection> }) => {
      return await apiRequest("PATCH", `/api/admin/hero-sections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-sections"] });
      toast({ title: "Hero section updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update hero section", variant: "destructive" });
    },
  });

  const handleFileUpload = async (heroId: string, file: File) => {
    setIsUploading(heroId);
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
          [heroId]: { ...prev[heroId], backgroundImageUrl: result.imageUrl }
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

  const updateField = (heroId: string, field: keyof HeroSection, value: any) => {
    setEditData(prev => ({
      ...prev,
      [heroId]: { ...prev[heroId], [field]: value }
    }));
  };

  const saveHero = (heroId: string) => {
    const data = editData[heroId];
    if (data) {
      updateMutation.mutate({ id: heroId, data });
    }
  };

  const toggleVisibility = (heroId: string) => {
    const current = editData[heroId]?.isActive ?? true;
    updateMutation.mutate({ id: heroId, data: { isActive: !current } });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Hero Sections">
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Hero Sections">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Hero Sections</h1>
          <p className="text-muted-foreground">
            Manage hero banners for each page. Toggle visibility, update content, and customize appearance.
          </p>
        </div>

        <div className="space-y-4">
          {heroSections?.map(hero => {
            const isExpanded = expandedHero === hero.id;
            const data = editData[hero.id] || hero;
            const isActive = data.isActive ?? true;

            return (
              <Card key={hero.id} className={!isActive ? "opacity-60" : ""}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedHero(isExpanded ? null : hero.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Image className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">
                          {PAGE_LABELS[hero.page] || hero.page}
                        </CardTitle>
                        <CardDescription>{hero.title}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Visible" : "Hidden"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(hero.id);
                        }}
                        data-testid={`button-toggle-hero-${hero.page}`}
                      >
                        {isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={data.title || ""}
                          onChange={(e) => updateField(hero.id, "title", e.target.value)}
                          placeholder="Hero title"
                          data-testid={`input-hero-title-${hero.page}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input
                          value={data.subtitle || ""}
                          onChange={(e) => updateField(hero.id, "subtitle", e.target.value)}
                          placeholder="Hero subtitle"
                          data-testid={`input-hero-subtitle-${hero.page}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={data.description || ""}
                        onChange={(e) => updateField(hero.id, "description", e.target.value)}
                        placeholder="Optional description text"
                        rows={2}
                        data-testid={`input-hero-description-${hero.page}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Background Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          value={data.backgroundImageUrl || ""}
                          onChange={(e) => updateField(hero.id, "backgroundImageUrl", e.target.value)}
                          placeholder="https://example.com/image.jpg or upload"
                          className="flex-1"
                          data-testid={`input-hero-image-${hero.page}`}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={isUploading === hero.id}
                          onClick={() => document.getElementById(`hero-upload-${hero.id}`)?.click()}
                          data-testid={`button-upload-hero-${hero.page}`}
                        >
                          {isUploading === hero.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        </Button>
                        <input
                          id={`hero-upload-${hero.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(hero.id, file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                      {data.backgroundImageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden h-32 bg-muted">
                          <img 
                            src={data.backgroundImageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Primary CTA Text</Label>
                        <Input
                          value={data.ctaText || ""}
                          onChange={(e) => updateField(hero.id, "ctaText", e.target.value)}
                          placeholder="Explore Now"
                          data-testid={`input-hero-cta-${hero.page}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary CTA Link</Label>
                        <Input
                          value={data.ctaLink || ""}
                          onChange={(e) => updateField(hero.id, "ctaLink", e.target.value)}
                          placeholder="/facilities"
                          data-testid={`input-hero-cta-link-${hero.page}`}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Secondary CTA Text</Label>
                        <Input
                          value={data.ctaSecondaryText || ""}
                          onChange={(e) => updateField(hero.id, "ctaSecondaryText", e.target.value)}
                          placeholder="Learn More"
                          data-testid={`input-hero-cta2-${hero.page}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary CTA Link</Label>
                        <Input
                          value={data.ctaSecondaryLink || ""}
                          onChange={(e) => updateField(hero.id, "ctaSecondaryLink", e.target.value)}
                          placeholder="/about"
                          data-testid={`input-hero-cta2-link-${hero.page}`}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Alignment</Label>
                        <Select
                          value={data.alignment || "center"}
                          onValueChange={(value) => updateField(hero.id, "alignment", value)}
                        >
                          <SelectTrigger data-testid={`select-hero-alignment-${hero.page}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Height</Label>
                        <Select
                          value={data.height || "large"}
                          onValueChange={(value) => updateField(hero.id, "height", value)}
                        >
                          <SelectTrigger data-testid={`select-hero-height-${hero.page}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                            <SelectItem value="full">Full Screen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Overlay Opacity ({data.overlayOpacity || 50}%)</Label>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={data.overlayOpacity || 50}
                          onChange={(e) => updateField(hero.id, "overlayOpacity", parseInt(e.target.value))}
                          className="h-9"
                          data-testid={`input-hero-overlay-${hero.page}`}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={() => saveHero(hero.id)}
                      disabled={updateMutation.isPending}
                      className="w-full"
                      data-testid={`button-save-hero-${hero.page}`}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {(!heroSections || heroSections.length === 0) && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No hero sections found. Hero sections are created automatically when pages are first accessed.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
