import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
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
import type { MembershipTierDefinition } from "@shared/schema";

export default function MembershipTierManagement() {
  const { toast } = useToast();
  const [editingTier, setEditingTier] = useState<MembershipTierDefinition | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    displayName: "",
    description: "",
    color: "#6B7280",
    discountPercent: 0,
    guestPassesIncluded: 0,
    benefits: [] as string[],
    sortOrder: 0,
    isActive: true,
  });
  const [benefitInput, setBenefitInput] = useState("");

  const { data: tierDefinitions, isLoading } = useQuery<MembershipTierDefinition[]>({
    queryKey: ["/api/admin/membership-tiers"],
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/membership-tiers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/membership-tiers"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/membership-tiers", data);
    },
    onSuccess: () => {
      invalidateQueries();
      toast({ title: "Membership tier created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create membership tier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/membership-tiers/${id}`, data);
    },
    onSuccess: () => {
      invalidateQueries();
      toast({ title: "Membership tier updated successfully" });
      setIsDialogOpen(false);
      setEditingTier(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update membership tier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/membership-tiers/${id}`);
    },
    onSuccess: () => {
      invalidateQueries();
      toast({ title: "Membership tier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete membership tier", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      displayName: "",
      description: "",
      color: "#6B7280",
      discountPercent: 0,
      guestPassesIncluded: 0,
      benefits: [],
      sortOrder: 0,
      isActive: true,
    });
    setBenefitInput("");
  };

  const handleEdit = (tier: MembershipTierDefinition) => {
    setEditingTier(tier);
    setFormData({
      slug: tier.slug,
      displayName: tier.displayName,
      description: tier.description || "",
      color: tier.color || "#6B7280",
      discountPercent: tier.discountPercent || 0,
      guestPassesIncluded: tier.guestPassesIncluded || 0,
      benefits: tier.benefits || [],
      sortOrder: tier.sortOrder || 0,
      isActive: tier.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({ ...formData, benefits: [...formData.benefits, benefitInput.trim()] });
      setBenefitInput("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({ 
      ...formData, 
      benefits: formData.benefits.filter((_, i) => i !== index) 
    });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  if (isLoading) {
    return (
      <AdminLayout title="Membership Tiers">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  const sortedTiers = [...(tierDefinitions || [])].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <AdminLayout title="Membership Tiers">
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Define membership tier types with their names, colors, discount percentages, and benefits.
            </p>
            <p className="text-sm text-muted-foreground">
              These tiers are used throughout the website for pricing and membership management.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTier(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-tier">
                <Plus className="w-4 h-4 mr-2" /> Add Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTier ? "Edit Membership Tier" : "Add New Membership Tier"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({ 
                          ...formData, 
                          displayName: name,
                          slug: formData.slug || generateSlug(name)
                        });
                      }}
                      placeholder="e.g., Platinum Member"
                      data-testid="input-display-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL-friendly ID)</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                      placeholder="e.g., platinum"
                      data-testid="input-slug"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this membership tier"
                    data-testid="input-description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Tier Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-9 p-1 cursor-pointer"
                        data-testid="input-color"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#6B7280"
                        className="flex-1"
                        data-testid="input-color-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent">Discount % (Off-Peak)</Label>
                    <Input
                      id="discountPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                      data-testid="input-discount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestPasses">Guest Passes/Month</Label>
                    <Input
                      id="guestPasses"
                      type="number"
                      min="0"
                      value={formData.guestPassesIncluded}
                      onChange={(e) => setFormData({ ...formData, guestPassesIncluded: parseInt(e.target.value) || 0 })}
                      data-testid="input-guest-passes"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Benefits</Label>
                  <div className="flex gap-2">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="Add a benefit"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                      data-testid="input-benefit"
                    />
                    <Button type="button" onClick={addBenefit} variant="secondary" data-testid="button-add-benefit">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.benefits.map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1" data-testid={`badge-benefit-${index}`}>
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                          data-testid={`button-remove-benefit-${index}`}
                        >
                          x
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Sort Order</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      data-testid="input-sort-order"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-is-active"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-tier"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editingTier ? "Update Tier" : "Create Tier")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Membership Tier Definitions</CardTitle>
            <CardDescription>
              Configure the properties of each membership tier. Changes here affect how tiers are displayed across the website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Guest Passes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTiers.map((tier) => (
                  <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                        {tier.sortOrder}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-tier-name-${tier.id}`}>{tier.displayName}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded" data-testid={`text-tier-slug-${tier.id}`}>{tier.slug}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: tier.color || '#6B7280' }}
                        />
                        <span className="text-xs text-muted-foreground">{tier.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>{tier.discountPercent}%</TableCell>
                    <TableCell>{tier.guestPassesIncluded}</TableCell>
                    <TableCell>
                      <Badge variant={tier.isActive ? "default" : "secondary"} data-testid={`badge-status-${tier.id}`}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(tier)}
                          data-testid={`button-edit-tier-${tier.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this tier?")) {
                              deleteMutation.mutate(tier.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-tier-${tier.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedTiers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No membership tiers defined yet. Click "Add Tier" to create one.
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
