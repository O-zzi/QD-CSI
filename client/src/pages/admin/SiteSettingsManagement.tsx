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
import { Save, Phone, Mail, MapPin, Clock, Globe, Eye, EyeOff, MessageSquare } from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin, SiYoutube, SiX, SiWhatsapp } from "react-icons/si";
import { Switch } from "@/components/ui/switch";
import type { SiteSetting } from "@shared/schema";

interface SocialLink {
  key: string;
  label: string;
  icon: typeof SiFacebook;
  placeholder: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  { key: "instagram", label: "Instagram", icon: SiInstagram, placeholder: "https://instagram.com/yourpage" },
  { key: "facebook", label: "Facebook", icon: SiFacebook, placeholder: "https://facebook.com/yourpage" },
  { key: "youtube", label: "YouTube", icon: SiYoutube, placeholder: "https://youtube.com/@yourchannel" },
  { key: "twitter", label: "Twitter/X", icon: SiX, placeholder: "https://twitter.com/yourhandle" },
  { key: "linkedin", label: "LinkedIn", icon: SiLinkedin, placeholder: "https://linkedin.com/company/yourcompany" },
];

export default function SiteSettingsManagement() {
  const { toast } = useToast();
  
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappVisible, setWhatsappVisible] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");

  const { data: siteSettings, isLoading } = useQuery<SiteSetting[]>({
    queryKey: ["/api/admin/site-settings"],
  });

  const getSettingValue = (key: string) => siteSettings?.find(s => s.key === key)?.value || "";

  useEffect(() => {
    if (siteSettings && !isLoading) {
      setContactEmail(getSettingValue("email"));
      setContactPhone(getSettingValue("phone"));
      setContactAddress(getSettingValue("address"));
      setOperatingHours(getSettingValue("operating_hours"));
      
      const links: Record<string, string> = {};
      SOCIAL_LINKS.forEach(link => {
        links[link.key] = getSettingValue(link.key);
      });
      setSocialLinks(links);
      
      setWhatsappPhone(getSettingValue("whatsapp_phone"));
      setWhatsappVisible(getSettingValue("whatsapp_button_visible") === "true");
      setWhatsappMessage(getSettingValue("whatsapp_message"));
    }
  }, [siteSettings, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (items: { key: string; value: string; label: string; category: string }[]) => {
      for (const item of items) {
        await apiRequest("POST", "/api/admin/site-settings", item);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const saveContactInfo = () => {
    saveMutation.mutate([
      { key: "email", value: contactEmail, label: "Contact Email", category: "contact" },
      { key: "phone", value: contactPhone, label: "Contact Phone", category: "contact" },
      { key: "address", value: contactAddress, label: "Contact Address", category: "contact" },
      { key: "operating_hours", value: operatingHours, label: "Operating Hours", category: "contact" },
    ]);
  };

  const saveSocialLinks = () => {
    const items = SOCIAL_LINKS.map(link => ({
      key: link.key,
      value: socialLinks[link.key] || "",
      label: `${link.label} URL`,
      category: "social",
    }));
    saveMutation.mutate(items);
  };

  const saveWhatsappSettings = () => {
    saveMutation.mutate([
      { key: "whatsapp_phone", value: whatsappPhone, label: "WhatsApp Phone", category: "whatsapp" },
      { key: "whatsapp_button_visible", value: whatsappVisible ? "true" : "false", label: "WhatsApp Button Visible", category: "whatsapp" },
      { key: "whatsapp_message", value: whatsappMessage, label: "WhatsApp Default Message", category: "whatsapp" },
    ]);
  };

  const updateSocialLink = (key: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
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
          <p className="text-muted-foreground">Manage contact information, social media links, and WhatsApp settings</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Update your business contact details displayed on the Contact page and footer
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Manage your social media URLs shown in the footer and Contact page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SOCIAL_LINKS.map((link) => {
                  const Icon = link.icon;
                  
                  return (
                    <div key={link.key} className="space-y-2">
                      <Label htmlFor={link.key} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Label>
                      <Input
                        id={link.key}
                        value={socialLinks[link.key] || ""}
                        onChange={(e) => updateSocialLink(link.key, e.target.value)}
                        placeholder={link.placeholder}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SiWhatsapp className="h-5 w-5 text-green-500" />
                  WhatsApp Button
                </CardTitle>
                <CardDescription>
                  Configure the floating WhatsApp button for quick customer contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsapp-visible" className="flex items-center gap-2">
                    Show WhatsApp Button
                  </Label>
                  <Switch
                    id="whatsapp-visible"
                    checked={whatsappVisible}
                    onCheckedChange={setWhatsappVisible}
                    data-testid="switch-whatsapp-visible"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp Phone Number
                  </Label>
                  <Input
                    id="whatsapp-phone"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+92 300 1234567 (include country code)"
                    data-testid="input-whatsapp-phone"
                  />
                  <p className="text-xs text-muted-foreground">Include country code, e.g., +92 for Pakistan</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp-message" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Default Message (Optional)
                  </Label>
                  <Textarea
                    id="whatsapp-message"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="Hello! I'd like to inquire about..."
                    rows={2}
                    data-testid="input-whatsapp-message"
                  />
                  <p className="text-xs text-muted-foreground">Pre-filled message when users click the WhatsApp button</p>
                </div>

                <Button 
                  onClick={saveWhatsappSettings} 
                  disabled={saveMutation.isPending}
                  className="w-full"
                  data-testid="button-save-whatsapp"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save WhatsApp Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
