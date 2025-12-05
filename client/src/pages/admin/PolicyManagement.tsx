import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Loader2, Plus, Trash2, GripVertical, ShieldCheck, FileText } from "lucide-react";
import type { CmsContent } from "@shared/schema";

interface PolicySection {
  section: string;
  content: string;
  items: string[];
}

const DEFAULT_PRIVACY_SECTIONS: PolicySection[] = [
  { section: "1. Information We Collect", content: "We collect information to provide and improve our services:", items: ["Personal Information: Name, email, phone number", "Membership Data: Tier, payment history, bookings", "Usage Information: Facility patterns, preferences"] },
  { section: "2. How We Use Information", content: "Your information is used to:", items: ["Process memberships and bookings", "Communicate updates", "Improve facilities and services"] },
  { section: "3. Contact", content: "For privacy inquiries, contact privacy@thequarterdeck.pk", items: [] },
];

const DEFAULT_TERMS_SECTIONS: PolicySection[] = [
  { section: "1. Acceptance of Terms", content: "By using The Quarterdeck facilities, you agree to these terms.", items: [] },
  { section: "2. Membership", content: "Membership is subject to approval and payment of fees.", items: ["Non-transferable", "Valid ID required", "Guest privileges vary by tier"] },
  { section: "3. Contact", content: "For questions, contact legal@thequarterdeck.pk", items: [] },
];

export default function PolicyManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("privacy");
  const [privacySections, setPrivacySections] = useState<PolicySection[]>([]);
  const [termsSections, setTermsSections] = useState<PolicySection[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: cmsData, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/cms/bulk"],
  });

  useEffect(() => {
    if (cmsData) {
      const privacy = cmsData.find(c => c.key === "privacy_policy");
      const terms = cmsData.find(c => c.key === "terms_conditions");
      
      try {
        if (privacy?.content) {
          setPrivacySections(JSON.parse(privacy.content));
        } else {
          setPrivacySections(DEFAULT_PRIVACY_SECTIONS);
        }
      } catch (e) {
        setPrivacySections(DEFAULT_PRIVACY_SECTIONS);
      }
      
      try {
        if (terms?.content) {
          setTermsSections(JSON.parse(terms.content));
        } else {
          setTermsSections(DEFAULT_TERMS_SECTIONS);
        }
      } catch (e) {
        setTermsSections(DEFAULT_TERMS_SECTIONS);
      }
    }
  }, [cmsData]);

  const saveMutation = useMutation({
    mutationFn: async ({ key, content }: { key: string; content: string }) => {
      return apiRequest('POST', '/api/admin/cms', {
        key,
        title: key === 'privacy_policy' ? 'Privacy Policy' : 'Terms & Conditions',
        content,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cms/bulk"] });
      toast({ title: "Saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const handleSavePrivacy = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        key: "privacy_policy",
        content: JSON.stringify(privacySections),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTerms = async () => {
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        key: "terms_conditions",
        content: JSON.stringify(termsSections),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSection = (type: "privacy" | "terms", index: number, field: keyof PolicySection, value: any) => {
    const setter = type === "privacy" ? setPrivacySections : setTermsSections;
    setter(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSection = (type: "privacy" | "terms") => {
    const newSection: PolicySection = {
      section: `${type === "privacy" ? privacySections.length + 1 : termsSections.length + 1}. New Section`,
      content: "",
      items: [],
    };
    if (type === "privacy") {
      setPrivacySections([...privacySections, newSection]);
    } else {
      setTermsSections([...termsSections, newSection]);
    }
  };

  const removeSection = (type: "privacy" | "terms", index: number) => {
    if (type === "privacy") {
      setPrivacySections(prev => prev.filter((_, i) => i !== index));
    } else {
      setTermsSections(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (type: "privacy" | "terms", sectionIndex: number, itemIndex: number, value: string) => {
    const setter = type === "privacy" ? setPrivacySections : setTermsSections;
    setter(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      const newItems = [...s.items];
      newItems[itemIndex] = value;
      return { ...s, items: newItems };
    }));
  };

  const addItem = (type: "privacy" | "terms", sectionIndex: number) => {
    const setter = type === "privacy" ? setPrivacySections : setTermsSections;
    setter(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      return { ...s, items: [...s.items, ""] };
    }));
  };

  const removeItem = (type: "privacy" | "terms", sectionIndex: number, itemIndex: number) => {
    const setter = type === "privacy" ? setPrivacySections : setTermsSections;
    setter(prev => prev.map((s, i) => {
      if (i !== sectionIndex) return s;
      return { ...s, items: s.items.filter((_, j) => j !== itemIndex) };
    }));
  };

  const renderSectionEditor = (type: "privacy" | "terms", sections: PolicySection[]) => (
    <div className="space-y-6">
      {sections.map((section, sIdx) => (
        <Card key={sIdx} className="relative">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-grab" />
              <div className="flex-1 space-y-4">
                <div>
                  <Label>Section Title</Label>
                  <Input
                    value={section.section}
                    onChange={(e) => updateSection(type, sIdx, "section", e.target.value)}
                    placeholder="1. Section Title"
                    data-testid={`input-section-title-${sIdx}`}
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection(type, sIdx, "content", e.target.value)}
                    placeholder="Section content..."
                    rows={3}
                    data-testid={`input-section-content-${sIdx}`}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeSection(type, sIdx)}
                data-testid={`button-remove-section-${sIdx}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Bullet Points</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(type, sIdx)}
                  data-testid={`button-add-item-${sIdx}`}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Item
                </Button>
              </div>
              {section.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No bullet points. Click "Add Item" to add one.</p>
              ) : (
                <div className="space-y-2">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateItem(type, sIdx, iIdx, e.target.value)}
                        placeholder="Bullet point text..."
                        data-testid={`input-item-${sIdx}-${iIdx}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive flex-shrink-0"
                        onClick={() => removeItem(type, sIdx, iIdx)}
                        data-testid={`button-remove-item-${sIdx}-${iIdx}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Button
        variant="outline"
        className="w-full"
        onClick={() => addSection(type)}
        data-testid={`button-add-section-${type}`}
      >
        <Plus className="w-4 h-4 mr-2" /> Add Section
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout title="Policy Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Policy Management">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-1">Privacy Policy & Terms Management</h2>
          <p className="text-sm text-muted-foreground">
            Edit the content displayed on the Privacy Policy and Terms & Conditions pages. Changes are reflected immediately on the website.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="privacy" className="flex items-center gap-2" data-testid="tab-privacy">
              <ShieldCheck className="w-4 h-4" />
              Privacy Policy
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2" data-testid="tab-terms">
              <FileText className="w-4 h-4" />
              Terms & Conditions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Privacy Policy Sections</h3>
                <p className="text-sm text-muted-foreground">Define sections that appear on the /privacy page.</p>
              </div>
              <Button onClick={handleSavePrivacy} disabled={isSaving} data-testid="button-save-privacy">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Privacy Policy
              </Button>
            </div>
            {renderSectionEditor("privacy", privacySections)}
          </TabsContent>

          <TabsContent value="terms" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Terms & Conditions Sections</h3>
                <p className="text-sm text-muted-foreground">Define sections that appear on the /terms page.</p>
              </div>
              <Button onClick={handleSaveTerms} disabled={isSaving} data-testid="button-save-terms">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Terms & Conditions
              </Button>
            </div>
            {renderSectionEditor("terms", termsSections)}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
