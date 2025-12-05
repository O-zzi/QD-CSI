import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Save, MapPin, Building } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Facility, Venue, FacilityVenue } from "@shared/schema";

export default function FacilitiesManagement() {
  const { toast } = useToast();
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [formData, setFormData] = useState({
    slug: "",
    name: "",
    description: "",
    category: "",
    basePrice: 0,
    minPlayers: 1,
    resourceCount: 1,
    requiresCertification: false,
    isRestricted: false,
    status: "PLANNED" as "OPENING_SOON" | "PLANNED" | "ACTIVE",
    imageUrl: "",
  });

  const [venueFormData, setVenueFormData] = useState({
    venueId: "",
    status: "PLANNED" as "PLANNED" | "COMING_SOON" | "ACTIVE",
    resourceCount: 1,
    priceOverride: "",
  });

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
  });

  const { data: venues } = useQuery<Venue[]>({
    queryKey: ["/api/admin/venues"],
  });

  const { data: facilityVenues, refetch: refetchFacilityVenues } = useQuery<FacilityVenue[]>({
    queryKey: ["/api/admin/facilities", editingFacility?.id, "venues"],
    queryFn: async () => {
      if (!editingFacility?.id) return [];
      const response = await fetch(`/api/admin/facilities/${editingFacility.id}/venues`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    enabled: !!editingFacility?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/facilities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: "Facility created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create facility", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/facilities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: "Facility updated successfully" });
      setIsDialogOpen(false);
      setEditingFacility(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update facility", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/facilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/facilities"] });
      toast({ title: "Facility deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete facility", variant: "destructive" });
    },
  });

  type VenueStatus = "PLANNED" | "COMING_SOON" | "ACTIVE";
  
  const addVenueMutation = useMutation({
    mutationFn: async (data: { facilityId: string; venueId: string; status: VenueStatus; resourceCount: number; priceOverride: number | null }) => {
      return await apiRequest("POST", `/api/admin/facilities/${data.facilityId}/venues`, data);
    },
    onSuccess: () => {
      refetchFacilityVenues();
      toast({ title: "Venue added to facility" });
      resetVenueForm();
    },
    onError: () => {
      toast({ title: "Failed to add venue", variant: "destructive" });
    },
  });

  const updateVenueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: VenueStatus; resourceCount?: number; priceOverride?: number | null } }) => {
      return await apiRequest("PATCH", `/api/admin/facility-venues/${id}`, data);
    },
    onSuccess: () => {
      refetchFacilityVenues();
      toast({ title: "Venue settings updated" });
    },
    onError: () => {
      toast({ title: "Failed to update venue settings", variant: "destructive" });
    },
  });

  const removeVenueMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/facility-venues/${id}`);
    },
    onSuccess: () => {
      refetchFacilityVenues();
      toast({ title: "Venue removed from facility" });
    },
    onError: () => {
      toast({ title: "Failed to remove venue", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      name: "",
      description: "",
      category: "",
      basePrice: 0,
      minPlayers: 1,
      resourceCount: 1,
      requiresCertification: false,
      isRestricted: false,
      status: "PLANNED",
      imageUrl: "",
    });
    setActiveTab("details");
  };

  const resetVenueForm = () => {
    setVenueFormData({
      venueId: "",
      status: "PLANNED",
      resourceCount: 1,
      priceOverride: "",
    });
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      slug: facility.slug,
      name: facility.name,
      description: facility.description || "",
      category: facility.category || "",
      basePrice: facility.basePrice,
      minPlayers: facility.minPlayers || 1,
      resourceCount: facility.resourceCount || 1,
      requiresCertification: facility.requiresCertification || false,
      isRestricted: facility.isRestricted || false,
      status: facility.status || "PLANNED",
      imageUrl: facility.imageUrl || "",
    });
    setActiveTab("details");
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingFacility) {
      updateMutation.mutate({ id: editingFacility.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddVenue = () => {
    if (!editingFacility || !venueFormData.venueId) return;
    addVenueMutation.mutate({
      facilityId: editingFacility.id,
      venueId: venueFormData.venueId,
      status: venueFormData.status,
      resourceCount: venueFormData.resourceCount,
      priceOverride: venueFormData.priceOverride ? parseInt(venueFormData.priceOverride) : null,
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "OPENING_SOON":
        return <Badge className="bg-amber-500">Opening Soon</Badge>;
      case "COMING_SOON":
        return <Badge className="bg-amber-500">Coming Soon</Badge>;
      case "PLANNED":
      default:
        return <Badge variant="secondary">Planned</Badge>;
    }
  };

  const getVenueName = (venueId: string) => {
    const venue = venues?.find(v => v.id === venueId);
    return venue?.name || "Unknown Venue";
  };

  const assignedVenueIds = facilityVenues?.map(fv => fv.venueId) || [];
  const availableVenues = venues?.filter(v => !assignedVenueIds.includes(v.id)) || [];

  if (isLoading) {
    return (
      <AdminLayout title="Facilities">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Facilities">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <p className="text-muted-foreground">
            Manage facilities available for booking at The Quarterdeck.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingFacility(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-facility">
                <Plus className="w-4 h-4 mr-2" /> Add Facility
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFacility ? "Edit Facility" : "Add New Facility"}</DialogTitle>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Facility Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="venues" 
                    className="flex items-center gap-2"
                    disabled={!editingFacility}
                  >
                    <MapPin className="w-4 h-4" />
                    Venue Settings
                    {!editingFacility && <span className="text-xs text-muted-foreground">(Save first)</span>}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        data-testid="input-facility-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL-friendly ID)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        data-testid="input-facility-slug"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      data-testid="input-facility-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Indoor Court, Precision Sport"
                        data-testid="input-facility-category"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Default Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: typeof formData.status) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger data-testid="select-facility-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PLANNED">Planned</SelectItem>
                          <SelectItem value="OPENING_SOON">Opening Soon</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Base Price (PKR)</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                        data-testid="input-facility-price"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minPlayers">Min Players</Label>
                      <Input
                        id="minPlayers"
                        type="number"
                        value={formData.minPlayers}
                        onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) || 1 })}
                        data-testid="input-facility-min-players"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resourceCount">Default Resource Count</Label>
                      <Input
                        id="resourceCount"
                        type="number"
                        value={formData.resourceCount}
                        onChange={(e) => setFormData({ ...formData, resourceCount: parseInt(e.target.value) || 1 })}
                        data-testid="input-facility-resource-count"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-facility-image"
                    />
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="requiresCertification"
                        checked={formData.requiresCertification}
                        onCheckedChange={(checked) => setFormData({ ...formData, requiresCertification: checked })}
                      />
                      <Label htmlFor="requiresCertification">Requires Certification</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isRestricted"
                        checked={formData.isRestricted}
                        onCheckedChange={(checked) => setFormData({ ...formData, isRestricted: checked })}
                      />
                      <Label htmlFor="isRestricted">Restricted Access</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-facility"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingFacility ? "Update" : "Create"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="venues" className="space-y-4 py-4">
                  {editingFacility && (
                    <>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <h4 className="font-medium">Add Venue</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Venue</Label>
                            <Select
                              value={venueFormData.venueId}
                              onValueChange={(value) => setVenueFormData({ ...venueFormData, venueId: value })}
                            >
                              <SelectTrigger data-testid="select-venue">
                                <SelectValue placeholder="Select venue..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableVenues.length === 0 ? (
                                  <SelectItem value="none" disabled>No venues available</SelectItem>
                                ) : (
                                  availableVenues.map(venue => (
                                    <SelectItem key={venue.id} value={venue.id}>
                                      {venue.name} ({venue.city})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Status at Venue</Label>
                            <Select
                              value={venueFormData.status}
                              onValueChange={(value: typeof venueFormData.status) => setVenueFormData({ ...venueFormData, status: value })}
                            >
                              <SelectTrigger data-testid="select-venue-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PLANNED">Planned</SelectItem>
                                <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Resource Count at Venue</Label>
                            <Input
                              type="number"
                              value={venueFormData.resourceCount}
                              onChange={(e) => setVenueFormData({ ...venueFormData, resourceCount: parseInt(e.target.value) || 1 })}
                              data-testid="input-venue-resource-count"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Price Override (PKR)</Label>
                            <Input
                              type="number"
                              value={venueFormData.priceOverride}
                              onChange={(e) => setVenueFormData({ ...venueFormData, priceOverride: e.target.value })}
                              placeholder={`Leave empty to use base price (${formData.basePrice})`}
                              data-testid="input-venue-price-override"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleAddVenue}
                          disabled={!venueFormData.venueId || addVenueMutation.isPending}
                          data-testid="button-add-venue"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Venue
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Assigned Venues</h4>
                        {(!facilityVenues || facilityVenues.length === 0) ? (
                          <p className="text-muted-foreground text-sm py-4 text-center">
                            No venues assigned to this facility yet. Add a venue above to configure venue-specific settings.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Venue</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Resources</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {facilityVenues.map((fv) => (
                                <TableRow key={fv.id} data-testid={`row-venue-${fv.id}`}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-muted-foreground" />
                                      {getVenueName(fv.venueId)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={fv.status || "PLANNED"}
                                      onValueChange={(value) => updateVenueMutation.mutate({ 
                                        id: fv.id, 
                                        data: { status: value as "PLANNED" | "COMING_SOON" | "ACTIVE" } 
                                      })}
                                    >
                                      <SelectTrigger className="w-32" data-testid={`select-fv-status-${fv.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PLANNED">Planned</SelectItem>
                                        <SelectItem value="COMING_SOON">Coming Soon</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      className="w-20"
                                      value={fv.resourceCount || 1}
                                      onChange={(e) => updateVenueMutation.mutate({ 
                                        id: fv.id, 
                                        data: { resourceCount: parseInt(e.target.value) || 1 } 
                                      })}
                                      data-testid={`input-fv-resources-${fv.id}`}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      className="w-28"
                                      value={fv.priceOverride || ""}
                                      placeholder={formData.basePrice.toString()}
                                      onChange={(e) => updateVenueMutation.mutate({ 
                                        id: fv.id, 
                                        data: { priceOverride: e.target.value ? parseInt(e.target.value) : null } 
                                      })}
                                      data-testid={`input-fv-price-${fv.id}`}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm("Remove this venue from the facility?")) {
                                          removeVenueMutation.mutate(fv.id);
                                        }
                                      }}
                                      data-testid={`button-remove-venue-${fv.id}`}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Courts/Resources</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities?.map((facility) => (
                  <TableRow key={facility.id} data-testid={`row-facility-${facility.id}`}>
                    <TableCell className="font-medium">{facility.name}</TableCell>
                    <TableCell>{facility.category || "-"}</TableCell>
                    <TableCell>{getStatusBadge(facility.status)}</TableCell>
                    <TableCell>PKR {facility.basePrice.toLocaleString()}</TableCell>
                    <TableCell>{facility.resourceCount}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(facility)}
                        data-testid={`button-edit-facility-${facility.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this facility?")) {
                            deleteMutation.mutate(facility.id);
                          }
                        }}
                        data-testid={`button-delete-facility-${facility.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!facilities || facilities.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No facilities found. Add your first facility to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
