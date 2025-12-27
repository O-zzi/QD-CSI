import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Phone, Mail, MapPin, Clock, Globe, Eye, EyeOff } from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin, SiYoutube, SiX, SiWhatsapp } from "react-icons/si";
import type { CmsContent } from "@shared/schema";

interface SocialLink {
  key: string;
  label: string;
  icon: typeof SiFacebook;
  placeholder: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  { key: "social_instagram", label: "Instagram", icon: SiInstagram, placeholder: "https://instagram.com/yourpage" },
  { key: "social_facebook", label: "Facebook", icon: SiFacebook, placeholder: "https://facebook.com/yourpage" },
  { key: "social_youtube", label: "YouTube", icon: SiYoutube, placeholder: "https://youtube.com/@yourchannel" },
  { key: "social_twitter", label: "Twitter/X", icon: SiX, placeholder: "https://twitter.com/yourhandle" },
  { key: "social_linkedin", label: "LinkedIn", icon: SiLinkedin, placeholder: "https://linkedin.com/company/yourcompany" },
  { key: "social_whatsapp", label: "WhatsApp", icon: SiWhatsapp, placeholder: "+92 300 1234567" },
];

export default function SiteSettingsManagement() {
  const { toast } = useToast();
  
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [siteStatus, setSiteStatus] = useState("");
  
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialVisibility, setSocialVisibility] = useState<Record<string, boolean>>({});

  const { data: cmsContent, isLoading } = useQuery<CmsContent[]>({
    queryKey: ["/api/admin/cms/content"],
  });

  const getCmsValue = (key: string) => cmsContent?.find(c => c.key === key)?.content || "";
  const getCmsVisibility = (key: string) => cmsContent?.find(c => c.key === key)?.isActive !== false;

  useEffect(() => {
    if (cmsContent && !isLoading) {
      setContactEmail(getCmsValue("contact_email"));
      setContactPhone(getCmsValue("contact_phone"));
      setContactAddress(getCmsValue("contact_address"));
      setOperatingHours(getCmsValue("contact_operating_hours"));
      setSiteStatus(getCmsValue("contact_site_status"));
      
      const links: Record<string, string> = {};
      const visibility: Record<string, boolean> = {};
      SOCIAL_LINKS.forEach(link => {
        links[link.key] = getCmsValue(link.key);
        visibility[link.key] = getCmsVisibility(link.key);
      });
      setSocialLinks(links);
      setSocialVisibility(visibility);
    }
  }, [cmsContent, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (items: { key: string; content: string; title: string; isActive?: boolean }[]) => {
      for (const item of items) {
        await apiRequest("POST", "/api/admin/cms/content", {
          key: item.key,
          title: item.title,
          content: item.content,
          isActive: item.isActive ?? true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cms/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cms/content"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const saveContactInfo = () => {
    saveMutation.mutate([
      { key: "contact_email", title: "Contact Email", content: contactEmail },
      { key: "contact_phone", title: "Contact Phone", content: contactPhone },
      { key: "contact_address", title: "Contact Address", content: contactAddress },
      { key: "contact_operating_hours", title: "Operating Hours", content: operatingHours },
      { key: "contact_site_status", title: "Site Status", content: siteStatus },
    ]);
  };

  const saveSocialLinks = () => {
    const items = SOCIAL_LINKS.map(link => ({
      key: link.key,
      title: `${link.label} URL`,
      content: socialLinks[link.key] || "",
      isActive: socialVisibility[link.key] ?? true,
    }));
    saveMutation.mutate(items);
  };

  const updateSocialLink = (key: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  const toggleSocialVisibility = (key: string) => {
    setSocialVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <AdminLayout title="Site Settings">
        <div className="p-6">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage contact information and social media links</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Update your business contact details displayed across the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@thequarterdeck.pk"
                  data-testid="input-contact-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+92 51 1234567"
                  data-testid="input-contact-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="Sector F-7, Islamabad, Pakistan"
                  rows={2}
                  data-testid="input-contact-address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </Label>
                <Textarea
                  id="hours"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="Mon-Fri: 6:00 AM - 11:00 PM | Sat-Sun: 7:00 AM - 10:00 PM"
                  rows={2}
                  data-testid="input-operating-hours"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Site Status Message</Label>
                <Textarea
                  id="status"
                  value={siteStatus}
                  onChange={(e) => setSiteStatus(e.target.value)}
                  placeholder="Current construction or operational status..."
                  rows={3}
                  data-testid="input-site-status"
                />
              </div>

              <Button 
                onClick={saveContactInfo} 
                disabled={saveMutation.isPending}
                className="w-full"
                data-testid="button-save-contact"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Contact Info
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media Links
              </CardTitle>
              <CardDescription>
                Manage your social media URLs. Toggle visibility to show/hide on the website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SOCIAL_LINKS.map((link) => {
                const Icon = link.icon;
                const isVisible = socialVisibility[link.key] ?? true;
                
                return (
                  <div key={link.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={link.key} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {isVisible ? "Visible" : "Hidden"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSocialVisibility(link.key)}
                          data-testid={`button-toggle-${link.key}`}
                        >
                          {isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Input
                      id={link.key}
                      value={socialLinks[link.key] || ""}
                      onChange={(e) => updateSocialLink(link.key, e.target.value)}
                      placeholder={link.placeholder}
                      className={!isVisible ? "opacity-50" : ""}
                      data-testid={`input-${link.key}`}
                    />
                  </div>
                );
              })}

              <Button 
                onClick={saveSocialLinks} 
                disabled={saveMutation.isPending}
                className="w-full"
                data-testid="button-save-social"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Social Links
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
