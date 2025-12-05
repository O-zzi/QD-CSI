import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Plus, Trash2 } from "lucide-react";
import type { CmsContent } from "@shared/schema";

const defaultSections = [
  { key: "hero_title", label: "Hero Title", type: "text" },
  { key: "hero_subtitle", label: "Hero Subtitle", type: "textarea" },
  { key: "about_title", label: "About Section Title", type: "text" },
  { key: "about_content", label: "About Section Content", type: "textarea" },
  { key: "facilities_title", label: "Facilities Section Title", type: "text" },
  { key: "facilities_subtitle", label: "Facilities Section Subtitle", type: "textarea" },
  { key: "membership_title", label: "Membership Section Title", type: "text" },
  { key: "membership_subtitle", label: "Membership Section Subtitle", type: "textarea" },
  { key: "contact_email", label: "Contact Email", type: "text" },
  { key: "contact_phone", label: "Contact Phone", type: "text" },
  { key: "contact_address", label: "Contact Address", type: "textarea" },
];

export default function HomepageManagement() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: cmsContent, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/admin/cms"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; content: string }) => {
      return await apiRequest("POST", "/api/admin/cms", {
        key: data.key,
        title: defaultSections.find(s => s.key === data.key)?.label || data.key,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms"] });
      toast({ title: "Content saved successfully" });
    },
    onError: () => {
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

  const handleSave = (key: string) => {
    saveMutation.mutate({ key, content: getContentValue(key) });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Homepage Content">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Homepage Content">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Homepage Content</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Manage the text content displayed on the public homepage. Changes will be reflected immediately.
            </p>

            <div className="space-y-6">
              {defaultSections.map((section) => (
                <div key={section.key} className="space-y-2 p-4 border rounded-md">
                  <Label htmlFor={section.key}>{section.label}</Label>
                  {section.type === "textarea" ? (
                    <Textarea
                      id={section.key}
                      value={getContentValue(section.key)}
                      onChange={(e) => handleChange(section.key, e.target.value)}
                      rows={4}
                      data-testid={`input-${section.key}`}
                    />
                  ) : (
                    <Input
                      id={section.key}
                      value={getContentValue(section.key)}
                      onChange={(e) => handleChange(section.key, e.target.value)}
                      data-testid={`input-${section.key}`}
                    />
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleSave(section.key)}
                    disabled={saveMutation.isPending}
                    data-testid={`button-save-${section.key}`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
