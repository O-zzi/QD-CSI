import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Save, GripVertical, Image, Navigation, ExternalLink, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SiteSetting, NavbarItem } from "@shared/schema";

export default function BrandingManagement() {
  const { toast } = useToast();
  const [editingNavItem, setEditingNavItem] = useState<NavbarItem | null>(null);
  const [isNavDialogOpen, setIsNavDialogOpen] = useState(false);
  const [navFormData, setNavFormData] = useState({
    label: "",
    href: "",
    sortOrder: 0,
    isVisible: true,
    target: "_self",
    requiresAuth: false,
    icon: "",
  });

  const [logoUrl, setLogoUrl] = useState("");
  const [logoDarkUrl, setLogoDarkUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteTagline, setSiteTagline] = useState("");
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleFileUpload = async (file: File, setUrl: (url: string) => void, uploadKey: string) => {
    setIsUploading(uploadKey);
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
        setUrl(result.imageUrl);
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

  const { data: siteSettings, isLoading: settingsLoading, dataUpdatedAt } = useQuery<SiteSetting[]>({
    queryKey: ["/api/admin/site-settings"],
  });

  const { data: navbarItems, isLoading: navLoading } = useQuery<NavbarItem[]>({
    queryKey: ["/api/admin/navbar-items"],
  });

  // Helper to get setting value
  const getSettingValue = (key: string) => siteSettings?.find(s => s.key === key)?.value || "";
  
  // Sync form state when data changes (including after save)
  useEffect(() => {
    if (siteSettings && !settingsLoading) {
      setLogoUrl(getSettingValue("logo_main_url"));
      setLogoDarkUrl(getSettingValue("logo_dark_url"));
      setFaviconUrl(getSettingValue("favicon_url"));
      setSiteName(getSettingValue("site_name") || "The Quarterdeck");
      setSiteTagline(getSettingValue("site_tagline") || "Sports & Recreation Complex");
    }
  }, [siteSettings, settingsLoading, dataUpdatedAt]);

  const saveBrandingMutation = useMutation({
    mutationFn: async (settings: { key: string; value: string; label: string; category: string }[]) => {
      for (const setting of settings) {
        await apiRequest("POST", "/api/admin/site-settings", setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Branding settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save branding settings", variant: "destructive" });
    },
  });

  const createNavMutation = useMutation({
    mutationFn: async (data: typeof navFormData) => {
      return await apiRequest("POST", "/api/admin/navbar-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/navbar-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navbar-items"] });
      toast({ title: "Navigation item created successfully" });
      setIsNavDialogOpen(false);
      resetNavForm();
    },
    onError: () => {
      toast({ title: "Failed to create navigation item", variant: "destructive" });
    },
  });

  const updateNavMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof navFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/navbar-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/navbar-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navbar-items"] });
      toast({ title: "Navigation item updated successfully" });
      setIsNavDialogOpen(false);
      setEditingNavItem(null);
      resetNavForm();
    },
    onError: () => {
      toast({ title: "Failed to update navigation item", variant: "destructive" });
    },
  });

  const deleteNavMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/navbar-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/navbar-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/navbar-items"] });
      toast({ title: "Navigation item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete navigation item", variant: "destructive" });
    },
  });

  const resetNavForm = () => {
    setNavFormData({
      label: "",
      href: "",
      sortOrder: 0,
      isVisible: true,
      target: "_self",
      requiresAuth: false,
      icon: "",
    });
  };

  const handleEditNavItem = (item: NavbarItem) => {
    setEditingNavItem(item);
    setNavFormData({
      label: item.label,
      href: item.href,
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
      target: item.target || "_self",
      requiresAuth: item.requiresAuth || false,
      icon: item.icon || "",
    });
    setIsNavDialogOpen(true);
  };

  const handleNavSubmit = () => {
    if (editingNavItem) {
      updateNavMutation.mutate({ id: editingNavItem.id, data: navFormData });
    } else {
      createNavMutation.mutate(navFormData);
    }
  };

  const handleSaveBranding = () => {
    const settings = [
      { key: "logo_main_url", value: logoUrl, label: "Main Logo URL", category: "branding" },
      { key: "logo_dark_url", value: logoDarkUrl, label: "Dark Mode Logo URL", category: "branding" },
      { key: "favicon_url", value: faviconUrl, label: "Favicon URL", category: "branding" },
      { key: "site_name", value: siteName, label: "Site Name", category: "branding" },
      { key: "site_tagline", value: siteTagline, label: "Site Tagline", category: "branding" },
    ];
    saveBrandingMutation.mutate(settings);
  };

  if (settingsLoading || navLoading) {
    return (
      <AdminLayout title="Branding & Navigation">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Branding & Navigation">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Site Branding
            </CardTitle>
            <CardDescription>
              Customize your site logo, favicon, and branding text. Provide URLs to your logo images.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="The Quarterdeck"
                  data-testid="input-site-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteTagline">Site Tagline</Label>
                <Input
                  id="siteTagline"
                  value={siteTagline}
                  onChange={(e) => setSiteTagline(e.target.value)}
                  placeholder="Sports & Recreation Complex"
                  data-testid="input-site-tagline"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Main Logo</Label>
              <div className="flex gap-2">
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png or upload"
                  data-testid="input-logo-url"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUploading === "logo"}
                  onClick={() => document.getElementById("logo-upload")?.click()}
                  data-testid="button-upload-logo"
                >
                  {isUploading === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, setLogoUrl, "logo");
                    e.target.value = "";
                  }}
                />
              </div>
              {logoUrl && (
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <img src={logoUrl} alt="Logo preview" className="h-12 w-auto object-contain" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoDarkUrl">Dark Mode Logo (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="logoDarkUrl"
                  value={logoDarkUrl}
                  onChange={(e) => setLogoDarkUrl(e.target.value)}
                  placeholder="https://example.com/logo-dark.png or upload"
                  data-testid="input-logo-dark-url"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUploading === "logoDark"}
                  onClick={() => document.getElementById("logo-dark-upload")?.click()}
                  data-testid="button-upload-logo-dark"
                >
                  {isUploading === "logoDark" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="logo-dark-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, setLogoDarkUrl, "logoDark");
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon</Label>
              <div className="flex gap-2">
                <Input
                  id="faviconUrl"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="https://example.com/favicon.ico or upload"
                  data-testid="input-favicon-url"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUploading === "favicon"}
                  onClick={() => document.getElementById("favicon-upload")?.click()}
                  data-testid="button-upload-favicon"
                >
                  {isUploading === "favicon" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
                <input
                  id="favicon-upload"
                  type="file"
                  accept="image/*,.ico"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, setFaviconUrl, "favicon");
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveBranding}
              disabled={saveBrandingMutation.isPending}
              data-testid="button-save-branding"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveBrandingMutation.isPending ? "Saving..." : "Save Branding Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Navigation Items
              </CardTitle>
              <CardDescription>
                Manage the navigation links that appear in the header.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                resetNavForm();
                setEditingNavItem(null);
                setIsNavDialogOpen(true);
              }}
              data-testid="button-add-nav-item"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {navbarItems && navbarItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Order</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {navbarItems.map((item) => (
                      <TableRow key={item.id} data-testid={`row-nav-${item.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span>{item.sortOrder}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {item.href}
                            {item.target === "_blank" && <ExternalLink className="h-3 w-3" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.isVisible ? (
                            <Badge variant="default" className="bg-green-600">Visible</Badge>
                          ) : (
                            <Badge variant="secondary">Hidden</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditNavItem(item)}
                              data-testid={`button-edit-nav-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteNavMutation.mutate(item.id)}
                              data-testid={`button-delete-nav-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No navigation items configured. Click "Add Item" to create one.
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isNavDialogOpen} onOpenChange={setIsNavDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingNavItem ? "Edit Navigation Item" : "Add Navigation Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="navLabel">Label</Label>
                <Input
                  id="navLabel"
                  value={navFormData.label}
                  onChange={(e) => setNavFormData({ ...navFormData, label: e.target.value })}
                  placeholder="Home"
                  data-testid="input-nav-label"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="navHref">Link URL</Label>
                <Input
                  id="navHref"
                  value={navFormData.href}
                  onChange={(e) => setNavFormData({ ...navFormData, href: e.target.value })}
                  placeholder="/home or https://..."
                  data-testid="input-nav-href"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="navOrder">Sort Order</Label>
                  <Input
                    id="navOrder"
                    type="number"
                    value={navFormData.sortOrder}
                    onChange={(e) => setNavFormData({ ...navFormData, sortOrder: parseInt(e.target.value) || 0 })}
                    data-testid="input-nav-order"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="navTarget">Link Target</Label>
                  <Select
                    value={navFormData.target}
                    onValueChange={(value) => setNavFormData({ ...navFormData, target: value })}
                  >
                    <SelectTrigger data-testid="select-nav-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Same Window</SelectItem>
                      <SelectItem value="_blank">New Window</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="navVisible">Visible</Label>
                <Switch
                  id="navVisible"
                  checked={navFormData.isVisible}
                  onCheckedChange={(checked) => setNavFormData({ ...navFormData, isVisible: checked })}
                  data-testid="switch-nav-visible"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="navAuth">Requires Authentication</Label>
                <Switch
                  id="navAuth"
                  checked={navFormData.requiresAuth}
                  onCheckedChange={(checked) => setNavFormData({ ...navFormData, requiresAuth: checked })}
                  data-testid="switch-nav-auth"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleNavSubmit}
                disabled={createNavMutation.isPending || updateNavMutation.isPending}
                data-testid="button-save-nav-item"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingNavItem ? "Update Item" : "Create Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
