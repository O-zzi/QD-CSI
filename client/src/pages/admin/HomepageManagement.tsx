import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Loader2, Database, FileText, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CMS_DEFAULTS } from "@/hooks/useCms";
import type { CmsContent } from "@shared/schema";

interface CmsSection {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "email";
  placeholder?: string;
}

const cmsSections: Record<string, { title: string; description: string; fields: CmsSection[] }> = {
  hero: {
    title: "Hero Section",
    description: "The main banner section at the top of the homepage.",
    fields: [
      { key: "hero_eyebrow", label: "Eyebrow Text", type: "text", placeholder: "Target Launch: Q4 2026" },
      { key: "hero_title", label: "Main Title", type: "textarea", placeholder: "A bright, premium multi-sport arena..." },
      { key: "hero_subtitle", label: "Subtitle", type: "textarea", placeholder: "The Quarterdeck brings state-of-the-art..." },
      { key: "hero_launch_date", label: "Launch Date (for countdown)", type: "date" },
      { key: "hero_cta_1", label: "Primary Button Text", type: "text", placeholder: "Explore Facilities" },
      { key: "hero_cta_2", label: "Secondary Button Text", type: "text", placeholder: "View Site Updates" },
      { key: "hero_status_active", label: "Status Badge 1", type: "text", placeholder: "Construction Active" },
      { key: "hero_status_updates", label: "Status Badge 2", type: "text", placeholder: "Transparent progress updates" },
      { key: "hero_status_booking", label: "Status Badge 3", type: "text", placeholder: "Early booking & waitlists planned" },
    ],
  },
  about: {
    title: "About Section",
    description: "Information about The Quarterdeck's vision and team.",
    fields: [
      { key: "about_title", label: "Section Title", type: "text", placeholder: "About The Quarterdeck" },
      { key: "about_subtitle", label: "Section Subtitle", type: "textarea", placeholder: "Our core vision..." },
      { key: "about_vision_title", label: "Vision Card Title", type: "text", placeholder: "Vision & Philosophy" },
      { key: "about_vision_content", label: "Vision Content", type: "textarea", placeholder: "The Quarterdeck is born from..." },
      { key: "about_vision_content_2", label: "Vision Content (Paragraph 2)", type: "textarea" },
      { key: "about_tags", label: "Keyword Tags (comma-separated)", type: "text", placeholder: "World-Class Courts,Community Focus,Transparency,All-Ages Friendly" },
      { key: "about_team_title", label: "Team Card Title", type: "text", placeholder: "The Project Team" },
      { key: "about_team_content", label: "Team Content", type: "textarea" },
      { key: "about_team_credits", label: "Team Credits (pipe-separated)", type: "textarea", placeholder: "Lead Architect: Studio 78|Structural Engineering: Eng. Solutions Pvt.|Padel Court Consultant: International Padel Federation" },
    ],
  },
  facilities: {
    title: "Facilities Section",
    description: "Overview of available sports facilities.",
    fields: [
      { key: "facilities_title", label: "Section Title", type: "text", placeholder: "World-Class Facilities" },
      { key: "facilities_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "facilities_cta", label: "CTA Button Text", type: "text", placeholder: "Check Court Availability" },
    ],
  },
  membership: {
    title: "Membership Section",
    description: "Membership options and benefits.",
    fields: [
      { key: "membership_title", label: "Section Title", type: "text", placeholder: "Membership Options" },
      { key: "membership_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "membership_cta", label: "CTA Button Text", type: "text", placeholder: "Explore Membership" },
    ],
  },
  contact: {
    title: "Contact Information",
    description: "Contact details displayed across the site.",
    fields: [
      { key: "contact_title", label: "Section Title", type: "text", placeholder: "Get In Touch" },
      { key: "contact_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "contact_email", label: "Email Address", type: "email", placeholder: "info@thequarterdeck.pk" },
      { key: "contact_phone", label: "Phone Number", type: "text", placeholder: "+92 51 1234567" },
      { key: "contact_address", label: "Physical Address", type: "textarea" },
      { key: "contact_hours", label: "Operating Hours", type: "text" },
    ],
  },
  updates: {
    title: "Updates Section",
    description: "Construction updates and progress section.",
    fields: [
      { key: "updates_title", label: "Section Title", type: "text", placeholder: "Construction Updates" },
      { key: "updates_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "updates_cta", label: "CTA Button Text", type: "text", placeholder: "View Full Roadmap" },
    ],
  },
  gallery: {
    title: "Gallery Section",
    description: "Progress photos and renders section.",
    fields: [
      { key: "gallery_title", label: "Section Title", type: "text", placeholder: "Gallery & Progress Photos" },
      { key: "gallery_subtitle", label: "Section Subtitle", type: "textarea" },
      { key: "gallery_cta", label: "CTA Button Text", type: "text", placeholder: "View Full Gallery" },
    ],
  },
  careers: {
    title: "Careers Page",
    description: "Content for the careers/jobs section.",
    fields: [
      { key: "careers_title", label: "Page Title", type: "text", placeholder: "Join Our Team" },
      { key: "careers_subtitle", label: "Page Subtitle", type: "textarea" },
      { key: "careers_cta", label: "CTA Button Text", type: "text", placeholder: "View Open Positions" },
    ],
  },
  rules: {
    title: "Rules Page",
    description: "Club rules and etiquette content.",
    fields: [
      { key: "rules_title", label: "Page Title", type: "text", placeholder: "Club Rules & Etiquette" },
      { key: "rules_subtitle", label: "Page Subtitle", type: "textarea" },
      { key: "rules_cta", label: "CTA Button Text", type: "text", placeholder: "View All Rules" },
    ],
  },
  events: {
    title: "Events Page",
    description: "Content for events and programs section.",
    fields: [
      { key: "events_title", label: "Page Title", type: "text", placeholder: "Events & Programs" },
      { key: "events_subtitle", label: "Page Subtitle", type: "textarea" },
    ],
  },
  leaderboard: {
    title: "Leaderboard Page",
    description: "Content for the leaderboard section.",
    fields: [
      { key: "leaderboard_title", label: "Page Title", type: "text", placeholder: "Leaderboard" },
      { key: "leaderboard_subtitle", label: "Page Subtitle", type: "textarea" },
    ],
  },
  coming_soon: {
    title: "Coming Soon Page",
    description: "Content for the pre-launch Coming Soon page.",
    fields: [
      { key: "coming_soon_title", label: "Page Title", type: "text", placeholder: "Something Amazing Is Coming" },
      { key: "coming_soon_subtitle", label: "Subtitle", type: "textarea" },
      { key: "coming_soon_description", label: "Description", type: "textarea" },
      { key: "coming_soon_cta", label: "CTA Button Text", type: "text", placeholder: "Join the Waitlist" },
      { key: "coming_soon_launch_date", label: "Launch Date", type: "date" },
      { key: "coming_soon_location", label: "Location Text", type: "text" },
    ],
  },
  social: {
    title: "Social Media Links",
    description: "Social media profile URLs.",
    fields: [
      { key: "social_facebook", label: "Facebook URL", type: "text" },
      { key: "social_instagram", label: "Instagram URL", type: "text" },
      { key: "social_twitter", label: "Twitter/X URL", type: "text" },
      { key: "social_linkedin", label: "LinkedIn URL", type: "text" },
      { key: "social_youtube", label: "YouTube URL", type: "text" },
    ],
  },
  footer: {
    title: "Footer Content",
    description: "Footer text and copyright information.",
    fields: [
      { key: "footer_tagline", label: "Tagline", type: "text" },
      { key: "footer_copyright", label: "Copyright Text", type: "text" },
      { key: "footer_disclaimer", label: "Disclaimer Text", type: "textarea" },
    ],
  },
  visibility: {
    title: "Section Visibility & Order",
    description: "Control which sections are displayed on the homepage and their display order.",
    fields: [],
  },
};

interface VisibilitySection {
  key: string;
  orderKey: string;
  label: string;
  description: string;
  defaultOrder: number;
}

const visibilitySections: VisibilitySection[] = [
  { key: "section_construction_status_visible", orderKey: "section_construction_status_order", label: "Construction Status Panel", description: "Hero section construction progress card", defaultOrder: 0 },
  { key: "section_about_visible", orderKey: "section_about_order", label: "About Section", description: "Vision, philosophy and team info", defaultOrder: 1 },
  { key: "section_facilities_visible", orderKey: "section_facilities_order", label: "Facilities Section", description: "Sports facility cards", defaultOrder: 2 },
  { key: "section_updates_visible", orderKey: "section_updates_order", label: "Construction Updates", description: "Progress timeline and milestones", defaultOrder: 3 },
  { key: "section_gallery_visible", orderKey: "section_gallery_order", label: "Gallery Section", description: "Photo gallery preview", defaultOrder: 4 },
  { key: "section_membership_visible", orderKey: "section_membership_order", label: "Membership Section", description: "Membership tiers and pricing", defaultOrder: 5 },
  { key: "section_rules_visible", orderKey: "section_rules_order", label: "Rules Section", description: "Club rules and safety", defaultOrder: 6 },
  { key: "section_careers_visible", orderKey: "section_careers_order", label: "Careers Section", description: "Job openings preview", defaultOrder: 7 },
];

export default function HomepageManagement() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const { data: cmsContent, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/admin/cms"],
  });

  // Initialize form data with existing values when CMS content loads
  useEffect(() => {
    if (cmsContent) {
      const initialData: Record<string, string> = {};
      cmsContent.forEach(item => {
        initialData[item.key] = item.content || "";
      });
      setFormData(prev => ({ ...initialData, ...prev }));
    }
  }, [cmsContent]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; content: string; title: string }) => {
      return await apiRequest("POST", "/api/admin/cms", {
        key: data.key,
        title: data.title,
        content: data.content,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/bulk"] });
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.delete(variables.key);
        return next;
      });
      setSavedKeys(prev => new Set(prev).add(variables.key));
      setTimeout(() => {
        setSavedKeys(prev => {
          const next = new Set(prev);
          next.delete(variables.key);
          return next;
        });
      }, 2000);
      toast({ title: "Content saved successfully" });
    },
    onError: (_, variables) => {
      setSavingKeys(prev => {
        const next = new Set(prev);
        next.delete(variables.key);
        return next;
      });
      toast({ title: "Failed to save content", variant: "destructive" });
    },
  });

  const getDbValue = (key: string): string | undefined => {
    const content = cmsContent?.find(c => c.key === key);
    return content?.content ?? undefined;
  };

  const getDefaultValue = (key: string): string => {
    return CMS_DEFAULTS[key] || "";
  };

  const getCurrentValue = (key: string): string => {
    // Priority: local edit > database > default
    if (formData[key] !== undefined && formData[key] !== "") return formData[key];
    const dbValue = getDbValue(key);
    if (dbValue !== undefined && dbValue !== "") return dbValue;
    return getDefaultValue(key);
  };

  const isFromDatabase = (key: string): boolean => {
    const dbValue = getDbValue(key);
    return dbValue !== undefined && dbValue !== "";
  };

  const hasLocalChanges = (key: string): boolean => {
    const dbValue = getDbValue(key) || "";
    const currentValue = formData[key];
    return currentValue !== undefined && currentValue !== dbValue;
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string, label: string) => {
    const value = formData[key] ?? getDbValue(key) ?? "";
    setSavingKeys(prev => new Set(prev).add(key));
    saveMutation.mutate({ key, content: value, title: label });
  };

  const handleSaveAll = (sectionKey: string) => {
    const section = cmsSections[sectionKey];
    section.fields.forEach(field => {
      const value = formData[field.key] ?? getDbValue(field.key) ?? "";
      if (value || hasLocalChanges(field.key)) {
        handleSave(field.key, field.label);
      }
    });
  };

  const handleResetToDefault = (key: string) => {
    const defaultValue = getDefaultValue(key);
    setFormData(prev => ({ ...prev, [key]: defaultValue }));
  };

  if (isLoading) {
    return (
      <AdminLayout title="Site Content">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Content">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Site Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm">Saved in database</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="text-sm">Using default value</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            </div>

            <Tabs defaultValue="hero" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
                {Object.entries(cmsSections).map(([key, section]) => (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="text-xs"
                    data-testid={`tab-${key}`}
                  >
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(cmsSections).map(([sectionKey, section]) => (
                <TabsContent key={sectionKey} value={sectionKey} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    {sectionKey !== 'visibility' && (
                      <Button
                        variant="outline"
                        onClick={() => handleSaveAll(sectionKey)}
                        data-testid={`button-save-all-${sectionKey}`}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save All Changes
                      </Button>
                    )}
                  </div>

                  {sectionKey === 'visibility' ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        Toggle sections on or off and set their display order on the homepage. Lower numbers appear first. Changes are saved automatically.
                      </p>
                      {visibilitySections
                        .slice()
                        .sort((a, b) => {
                          const orderA = parseInt(formData[a.orderKey] ?? getDbValue(a.orderKey) ?? String(a.defaultOrder), 10);
                          const orderB = parseInt(formData[b.orderKey] ?? getDbValue(b.orderKey) ?? String(b.defaultOrder), 10);
                          return orderA - orderB;
                        })
                        .map((vis) => {
                        const dbValue = getDbValue(vis.key);
                        const isVisible = (formData[vis.key] ?? dbValue ?? 'true').toLowerCase() === 'true';
                        const isSaving = savingKeys.has(vis.key) || savingKeys.has(vis.orderKey);
                        const isSaved = savedKeys.has(vis.key) || savedKeys.has(vis.orderKey);
                        const currentOrder = formData[vis.orderKey] ?? getDbValue(vis.orderKey) ?? String(vis.defaultOrder);
                        
                        return (
                          <div 
                            key={vis.key} 
                            className="flex items-center justify-between p-4 border rounded-lg gap-4"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {isVisible ? (
                                <Eye className="w-5 h-5 text-green-600 shrink-0" />
                              ) : (
                                <EyeOff className="w-5 h-5 text-muted-foreground shrink-0" />
                              )}
                              <div className="min-w-0">
                                <Label htmlFor={vis.key} className="font-medium cursor-pointer">
                                  {vis.label}
                                </Label>
                                <p className="text-xs text-muted-foreground">{vis.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={vis.orderKey} className="text-xs text-muted-foreground whitespace-nowrap">Order:</Label>
                                <Input
                                  id={vis.orderKey}
                                  type="number"
                                  min="1"
                                  max="10"
                                  className="w-16 text-center"
                                  value={currentOrder}
                                  onChange={(e) => {
                                    const newOrder = e.target.value;
                                    setFormData(prev => ({ ...prev, [vis.orderKey]: newOrder }));
                                  }}
                                  onBlur={() => {
                                    const orderValue = formData[vis.orderKey] ?? String(vis.defaultOrder);
                                    setSavingKeys(prev => new Set(prev).add(vis.orderKey));
                                    saveMutation.mutate({ 
                                      key: vis.orderKey, 
                                      content: orderValue, 
                                      title: `${vis.label} Order` 
                                    });
                                  }}
                                  data-testid={`input-${vis.orderKey}`}
                                />
                              </div>
                              {isSaved && (
                                <Badge className="bg-green-500 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Saved
                                </Badge>
                              )}
                              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                              <Switch
                                id={vis.key}
                                checked={isVisible}
                                onCheckedChange={(checked) => {
                                  const newValue = checked ? 'true' : 'false';
                                  setFormData(prev => ({ ...prev, [vis.key]: newValue }));
                                  setSavingKeys(prev => new Set(prev).add(vis.key));
                                  saveMutation.mutate({ 
                                    key: vis.key, 
                                    content: newValue, 
                                    title: vis.label 
                                  });
                                }}
                                disabled={isSaving}
                                data-testid={`toggle-${vis.key}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {section.fields.map((field) => {
                      const dbValue = getDbValue(field.key);
                      const defaultValue = getDefaultValue(field.key);
                      const currentValue = formData[field.key] ?? dbValue ?? "";
                      const fromDb = isFromDatabase(field.key);
                      const hasChanges = hasLocalChanges(field.key);

                      return (
                        <div key={field.key} className="space-y-2 p-4 border rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={field.key} className="font-medium">{field.label}</Label>
                              {savedKeys.has(field.key) ? (
                                <Badge className="bg-green-500 text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Saved
                                </Badge>
                              ) : hasChanges ? (
                                <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Unsaved
                                </Badge>
                              ) : fromDb ? (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                  <Database className="w-3 h-3 mr-1" />
                                  Database
                                </Badge>
                              ) : defaultValue ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Default
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1">
                              {defaultValue && !fromDb && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResetToDefault(field.key)}
                                  className="text-xs"
                                  title="Use default value"
                                >
                                  Reset
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSave(field.key, field.label)}
                                disabled={savingKeys.has(field.key)}
                                data-testid={`button-save-${field.key}`}
                              >
                                {savingKeys.has(field.key) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Show current website value preview */}
                          {defaultValue && !fromDb && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-amber-500">
                              <span className="font-medium">Currently showing on website: </span>
                              <span className="italic">{defaultValue.length > 150 ? defaultValue.substring(0, 150) + "..." : defaultValue}</span>
                            </div>
                          )}

                          {field.type === "textarea" ? (
                            <Textarea
                              id={field.key}
                              value={currentValue}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder || defaultValue || "Enter content..."}
                              rows={4}
                              className={hasChanges ? "border-blue-500" : ""}
                              data-testid={`input-${field.key}`}
                            />
                          ) : (
                            <Input
                              id={field.key}
                              type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                              value={currentValue}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder || defaultValue || "Enter content..."}
                              className={hasChanges ? "border-blue-500" : ""}
                              data-testid={`input-${field.key}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
