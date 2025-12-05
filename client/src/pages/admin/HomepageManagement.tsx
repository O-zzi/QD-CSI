import { useState } from "react";
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
import { Save, Loader2 } from "lucide-react";
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
      { key: "about_team_title", label: "Team Card Title", type: "text", placeholder: "The Project Team" },
      { key: "about_team_content", label: "Team Content", type: "textarea" },
    ],
  },
  facilities: {
    title: "Facilities Section",
    description: "Overview of available sports facilities.",
    fields: [
      { key: "facilities_title", label: "Section Title", type: "text", placeholder: "World-Class Facilities" },
      { key: "facilities_subtitle", label: "Section Subtitle", type: "textarea" },
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
  careers: {
    title: "Careers Page",
    description: "Content for the careers/jobs section.",
    fields: [
      { key: "careers_title", label: "Page Title", type: "text", placeholder: "Join Our Team" },
      { key: "careers_subtitle", label: "Page Subtitle", type: "textarea" },
      { key: "careers_intro", label: "Introduction Text", type: "textarea" },
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
  rules: {
    title: "Rules Page",
    description: "Club rules and etiquette content.",
    fields: [
      { key: "rules_title", label: "Page Title", type: "text", placeholder: "Club Rules & Etiquette" },
      { key: "rules_subtitle", label: "Page Subtitle", type: "textarea" },
      { key: "rules_intro", label: "Introduction Text", type: "textarea" },
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
};

export default function HomepageManagement() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  const { data: cmsContent, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/admin/cms"],
  });

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

  const getContentValue = (key: string) => {
    if (formData[key] !== undefined) return formData[key];
    const content = cmsContent?.find(c => c.key === key);
    return content?.content || "";
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: string, label: string) => {
    setSavingKeys(prev => new Set(prev).add(key));
    saveMutation.mutate({ key, content: getContentValue(key), title: label });
  };

  const handleSaveAll = (sectionKey: string) => {
    const section = cmsSections[sectionKey];
    section.fields.forEach(field => {
      const value = getContentValue(field.key);
      if (value) {
        handleSave(field.key, field.label);
      }
    });
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
            <p className="text-muted-foreground mb-6">
              Manage all text content across the website. Changes will be reflected on the public site.
            </p>

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
                    <Button
                      variant="outline"
                      onClick={() => handleSaveAll(sectionKey)}
                      data-testid={`button-save-all-${sectionKey}`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {section.fields.map((field) => (
                      <div key={field.key} className="space-y-2 p-4 border rounded-md">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={field.key}>{field.label}</Label>
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
                        {field.type === "textarea" ? (
                          <Textarea
                            id={field.key}
                            value={getContentValue(field.key)}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            rows={4}
                            data-testid={`input-${field.key}`}
                          />
                        ) : (
                          <Input
                            id={field.key}
                            type={field.type === "date" ? "date" : field.type === "email" ? "email" : "text"}
                            value={getContentValue(field.key)}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            data-testid={`input-${field.key}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
