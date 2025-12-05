import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, ExternalLink, Calendar, MapPin, Clock, Eye } from "lucide-react";
import { CMS_DEFAULTS } from "@/hooks/useCms";
import type { SiteSetting, CmsContent } from "@shared/schema";
import { format, differenceInDays } from "date-fns";

interface FieldConfig {
  key: string;
  label: string;
  description: string;
  type: "text" | "textarea" | "date";
  pageRef: string;
  defaultValue: string;
}

const COMING_SOON_FIELDS: FieldConfig[] = [
  {
    key: "coming_soon_launch_date",
    label: "Launch Date",
    description: "The countdown timer on the Coming Soon page counts down to this date",
    type: "date",
    pageRef: "/coming-soon",
    defaultValue: CMS_DEFAULTS.coming_soon_launch_date || "2025-12-25",
  },
  {
    key: "coming_soon_title",
    label: "Main Title",
    description: "The large heading on the Coming Soon page",
    type: "text",
    pageRef: "/coming-soon",
    defaultValue: CMS_DEFAULTS.coming_soon_title || "Something Extraordinary is Coming",
  },
  {
    key: "coming_soon_subtitle",
    label: "Subtitle",
    description: "The description text below the main title",
    type: "textarea",
    pageRef: "/coming-soon",
    defaultValue: CMS_DEFAULTS.coming_soon_subtitle || "Premium sports and recreation complex launching soon in Islamabad",
  },
  {
    key: "coming_soon_location",
    label: "Location",
    description: "The location displayed at the bottom of the page",
    type: "text",
    pageRef: "/coming-soon",
    defaultValue: CMS_DEFAULTS.coming_soon_location || "Sector F-7, Islamabad",
  },
  {
    key: "hero_eyebrow",
    label: "Launch Badge Text",
    description: "The small badge text shown above the countdown (e.g., 'Target Launch: Q4 2025')",
    type: "text",
    pageRef: "/coming-soon",
    defaultValue: CMS_DEFAULTS.hero_eyebrow || "Target Launch: Q4 2025",
  },
];

export default function ComingSoonManagement() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  const { data: cmsContent, isLoading: cmsLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/cms"],
  });

  const { data: siteSettings, isLoading: settingsLoading } = useQuery<SiteSetting[]>({
    queryKey: ["/api/admin/site-settings"],
  });

  useEffect(() => {
    if (!cmsLoading && !settingsLoading) {
      const initial: Record<string, string> = {};
      COMING_SOON_FIELDS.forEach((field) => {
        const cmsSetting = cmsContent?.find((c) => c.key === field.key);
        const siteSetting = siteSettings?.find((s) => s.key === field.key);
        initial[field.key] = cmsSetting?.content || siteSetting?.value || field.defaultValue;
      });
      setFormData(initial);
    }
  }, [cmsContent, siteSettings, cmsLoading, settingsLoading]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return await apiRequest("POST", "/api/admin/cms", { key, value });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      setEditedFields((prev) => {
        const next = new Set(prev);
        next.delete(variables.key);
        return next;
      });
      toast({ title: "Setting saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save setting", variant: "destructive" });
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setEditedFields((prev) => new Set(prev).add(key));
  };

  const handleSave = (key: string) => {
    saveMutation.mutate({ key, value: formData[key] });
  };

  const handleSaveAll = async () => {
    const promises = Array.from(editedFields).map((key) =>
      apiRequest("POST", "/api/admin/cms", { key, value: formData[key] })
    );
    try {
      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["/api/cms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      setEditedFields(new Set());
      toast({ title: "All changes saved successfully" });
    } catch {
      toast({ title: "Failed to save some settings", variant: "destructive" });
    }
  };

  const getValueSource = (key: string): "database" | "default" | "edited" => {
    if (editedFields.has(key)) return "edited";
    const cmsSetting = cmsContent?.find((c) => c.key === key);
    const siteSetting = siteSettings?.find((s) => s.key === key);
    if (cmsSetting || siteSetting) return "database";
    return "default";
  };

  const getSourceBadge = (source: "database" | "default" | "edited") => {
    switch (source) {
      case "database":
        return <Badge className="bg-green-500 text-xs">From Database</Badge>;
      case "edited":
        return <Badge className="bg-amber-500 text-xs">Edited (Unsaved)</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Using Default</Badge>;
    }
  };

  const launchDate = formData.coming_soon_launch_date
    ? new Date(formData.coming_soon_launch_date)
    : new Date("2025-12-25");
  const daysUntilLaunch = differenceInDays(launchDate, new Date());

  if (cmsLoading || settingsLoading) {
    return (
      <AdminLayout title="Coming Soon Page">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Coming Soon Page">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-muted-foreground">
              Manage the Coming Soon page content and countdown timer.
            </p>
            <a
              href="/coming-soon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
            >
              <Eye className="w-3 h-3" /> View Coming Soon Page
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {editedFields.size > 0 && (
            <Button onClick={handleSaveAll} data-testid="button-save-all-coming-soon">
              <Save className="w-4 h-4 mr-2" /> Save All Changes ({editedFields.size})
            </Button>
          )}
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Countdown Status
            </CardTitle>
            <CardDescription>
              Current countdown configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-background">
                <div className="text-3xl font-bold text-primary">{daysUntilLaunch}</div>
                <div className="text-sm text-muted-foreground">Days Until Launch</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background">
                <div className="text-xl font-semibold">
                  {format(launchDate, "MMMM d, yyyy")}
                </div>
                <div className="text-sm text-muted-foreground">Launch Date</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-background">
                <div className="text-xl font-semibold">
                  {daysUntilLaunch > 0 ? "Counting Down" : "Launched!"}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {COMING_SOON_FIELDS.map((field) => {
            const source = getValueSource(field.key);
            return (
              <Card key={field.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {field.label}
                        {getSourceBadge(source)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {field.description}
                      </CardDescription>
                    </div>
                    <a
                      href={field.pageRef}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 hover:underline whitespace-nowrap"
                    >
                      View on site <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {field.type === "textarea" ? (
                      <Textarea
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={3}
                        className="flex-1"
                        data-testid={`input-${field.key}`}
                      />
                    ) : field.type === "date" ? (
                      <Input
                        type="date"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="flex-1"
                        data-testid={`input-${field.key}`}
                      />
                    ) : (
                      <Input
                        value={formData[field.key] || ""}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="flex-1"
                        data-testid={`input-${field.key}`}
                      />
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleSave(field.key)}
                      disabled={!editedFields.has(field.key) || saveMutation.isPending}
                      data-testid={`button-save-${field.key}`}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                  {field.key === "coming_soon_launch_date" && formData[field.key] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Formatted: {format(new Date(formData[field.key]), "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
