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
import { 
  Save, 
  MapPin, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  Building2, 
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Venue } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMING_SOON", label: "Coming Soon" },
  { value: "PLANNED", label: "Planned" },
];

export default function VenuesManagement() {
  const { toast } = useToast();
  const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<Venue>>>({});
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newVenue, setNewVenue] = useState<{
    name: string;
    slug: string;
    city: string;
    country: string;
    status: "ACTIVE" | "COMING_SOON" | "PLANNED";
    isDefault: boolean;
    sortOrder: number;
  }>({
    name: "",
    slug: "",
    city: "",
    country: "Pakistan",
    status: "PLANNED",
    isDefault: false,
    sortOrder: 0,
  });

  const { data: venues, isLoading } = useQuery<Venue[]>({
    queryKey: ["/api/admin/venues"],
  });

  useEffect(() => {
    if (venues) {
      const data: Record<string, Partial<Venue>> = {};
      venues.forEach(venue => {
        data[venue.id] = { ...venue };
      });
      setEditData(data);
    }
  }, [venues]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Venue> }) => {
      const coercedData = {
        ...data,
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) }),
        ...(data.isDefault !== undefined && { isDefault: Boolean(data.isDefault) }),
      };
      return await apiRequest("PATCH", `/api/admin/venues/${id}`, coercedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Venue updated successfully" });
    },
    onError: (error: Error) => {
      console.error("Update venue error:", error);
      toast({ 
        title: "Failed to update venue", 
        description: error.message || "Please check your input and try again",
        variant: "destructive" 
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newVenue) => {
      return await apiRequest("POST", "/api/admin/venues", {
        ...data,
        sortOrder: Number(data.sortOrder),
        isDefault: Boolean(data.isDefault),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      setShowNewDialog(false);
      setNewVenue({
        name: "",
        slug: "",
        city: "",
        country: "Pakistan",
        status: "PLANNED",
        isDefault: false,
        sortOrder: 0,
      });
      toast({ title: "Venue created successfully" });
    },
    onError: (error: Error) => {
      console.error("Create venue error:", error);
      toast({ 
        title: "Failed to create venue", 
        description: error.message || "Please check your input and try again",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/venues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({ title: "Venue deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete venue", variant: "destructive" });
    },
  });

  const updateField = (venueId: string, field: keyof Venue, value: any) => {
    setEditData(prev => ({
      ...prev,
      [venueId]: { ...prev[venueId], [field]: value }
    }));
  };

  const saveVenue = (venueId: string) => {
    const data = editData[venueId];
    if (data) {
      const { id, createdAt, updatedAt, ...editableData } = data;
      updateMutation.mutate({ id: venueId, data: editableData });
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Venues Management">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Venues Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" data-testid="text-venues-title">Venue Locations</h2>
            <p className="text-muted-foreground">Manage multi-location venues (Islamabad, Lahore, Karachi, etc.)</p>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-venue">
                <Plus className="w-4 h-4 mr-2" /> Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Venue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-name">Venue Name</Label>
                    <Input
                      id="new-name"
                      value={newVenue.name}
                      onChange={(e) => {
                        setNewVenue({ 
                          ...newVenue, 
                          name: e.target.value,
                          slug: generateSlug(e.target.value)
                        });
                      }}
                      placeholder="The Quarterdeck Lahore"
                      data-testid="input-new-venue-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-slug">Slug</Label>
                    <Input
                      id="new-slug"
                      value={newVenue.slug}
                      onChange={(e) => setNewVenue({ ...newVenue, slug: e.target.value })}
                      placeholder="lahore"
                      data-testid="input-new-venue-slug"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-city">City</Label>
                    <Input
                      id="new-city"
                      value={newVenue.city}
                      onChange={(e) => setNewVenue({ ...newVenue, city: e.target.value })}
                      placeholder="Lahore"
                      data-testid="input-new-venue-city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-country">Country</Label>
                    <Input
                      id="new-country"
                      value={newVenue.country}
                      onChange={(e) => setNewVenue({ ...newVenue, country: e.target.value })}
                      placeholder="Pakistan"
                      data-testid="input-new-venue-country"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-status">Status</Label>
                    <Select 
                      value={newVenue.status} 
                      onValueChange={(value: "ACTIVE" | "COMING_SOON" | "PLANNED") => setNewVenue({ ...newVenue, status: value })}
                    >
                      <SelectTrigger data-testid="select-new-venue-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="new-sort">Sort Order</Label>
                    <Input
                      id="new-sort"
                      type="number"
                      value={newVenue.sortOrder}
                      onChange={(e) => setNewVenue({ ...newVenue, sortOrder: parseInt(e.target.value) || 0 })}
                      data-testid="input-new-venue-sort"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newVenue.isDefault}
                    onCheckedChange={(checked) => setNewVenue({ ...newVenue, isDefault: checked })}
                    data-testid="switch-new-venue-default"
                  />
                  <Label>Default venue (selected by default in booking system)</Label>
                </div>
                <Button 
                  onClick={() => createMutation.mutate(newVenue)}
                  disabled={!newVenue.name || !newVenue.city || !newVenue.slug || createMutation.isPending}
                  className="w-full"
                  data-testid="button-create-venue"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Venue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!venues?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Venues Yet</h3>
              <p className="text-muted-foreground mb-4">Add your first venue location to get started</p>
              <Button onClick={() => setShowNewDialog(true)} data-testid="button-add-first-venue">
                <Plus className="w-4 h-4 mr-2" /> Add First Venue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {venues.map((venue) => {
              const isExpanded = expandedVenue === venue.id;
              const currentData = editData[venue.id] || venue;
              
              return (
                <Card key={venue.id} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedVenue(isExpanded ? null : venue.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {venue.name}
                            {venue.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {venue.city}, {venue.country || 'Pakistan'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={venue.status === 'ACTIVE' ? "default" : venue.status === 'COMING_SOON' ? "secondary" : "outline"}>
                          {venue.status === 'ACTIVE' ? 'Active' : venue.status === 'COMING_SOON' ? 'Coming Soon' : 'Planned'}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="border-t pt-6">
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`name-${venue.id}`}>Venue Name</Label>
                            <Input
                              id={`name-${venue.id}`}
                              value={currentData.name || ""}
                              onChange={(e) => updateField(venue.id, "name", e.target.value)}
                              data-testid={`input-venue-name-${venue.id}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`slug-${venue.id}`}>Slug</Label>
                            <Input
                              id={`slug-${venue.id}`}
                              value={currentData.slug || ""}
                              onChange={(e) => updateField(venue.id, "slug", e.target.value)}
                              data-testid={`input-venue-slug-${venue.id}`}
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`city-${venue.id}`}>City</Label>
                            <Input
                              id={`city-${venue.id}`}
                              value={currentData.city || ""}
                              onChange={(e) => updateField(venue.id, "city", e.target.value)}
                              data-testid={`input-venue-city-${venue.id}`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`country-${venue.id}`} className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Country
                            </Label>
                            <Input
                              id={`country-${venue.id}`}
                              value={currentData.country || "Pakistan"}
                              onChange={(e) => updateField(venue.id, "country", e.target.value)}
                              data-testid={`input-venue-country-${venue.id}`}
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`status-${venue.id}`}>Status</Label>
                            <Select 
                              value={currentData.status || "PLANNED"} 
                              onValueChange={(value) => updateField(venue.id, "status", value)}
                            >
                              <SelectTrigger data-testid={`select-venue-status-${venue.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`sort-${venue.id}`}>Sort Order</Label>
                            <Input
                              id={`sort-${venue.id}`}
                              type="number"
                              value={currentData.sortOrder ?? 0}
                              onChange={(e) => updateField(venue.id, "sortOrder", parseInt(e.target.value) || 0)}
                              data-testid={`input-venue-sort-${venue.id}`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={currentData.isDefault ?? false}
                            onCheckedChange={(checked) => updateField(venue.id, "isDefault", checked)}
                            data-testid={`switch-venue-default-${venue.id}`}
                          />
                          <Label>Default venue (auto-selected in booking system)</Label>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-venue-${venue.id}`}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Venue
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Venue?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{venue.name}" and all associated data. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(venue.id)}
                                  className="bg-destructive text-destructive-foreground"
                                  data-testid="button-confirm-delete"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button 
                            onClick={() => saveVenue(venue.id)}
                            disabled={updateMutation.isPending}
                            data-testid={`button-save-venue-${venue.id}`}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
