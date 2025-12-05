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
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
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
import type { Facility } from "@shared/schema";

export default function FacilitiesManagement() {
  const { toast } = useToast();
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
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
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingFacility) {
      updateMutation.mutate({ id: editingFacility.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>;
      case "OPENING_SOON":
        return <Badge className="bg-amber-500">Opening Soon</Badge>;
      default:
        return <Badge variant="secondary">Planned</Badge>;
    }
  };

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
        <div className="flex justify-between items-center">
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFacility ? "Edit Facility" : "Add New Facility"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                    <Label htmlFor="status">Status</Label>
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
                    <Label htmlFor="resourceCount">Resource Count</Label>
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
              </div>
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
