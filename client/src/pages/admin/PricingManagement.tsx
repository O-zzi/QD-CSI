import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Save, Star, Settings } from "lucide-react";
import { Link } from "wouter";
import { useAdminPath } from "@/hooks/useAdminPath";
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
import type { PricingTier, MembershipTierDefinition } from "@shared/schema";

export default function PricingManagement() {
  const { toast } = useToast();
  const { adminPath } = useAdminPath();
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tier: "SILVER" as "FOUNDING" | "GOLD" | "SILVER" | "GUEST",
    price: 0,
    billingPeriod: "yearly",
    benefits: [] as string[],
    isPopular: false,
    sortOrder: 0,
    isActive: true,
  });
  const [benefitInput, setBenefitInput] = useState("");

  const { data: pricingTiers, isLoading } = useQuery<PricingTier[]>({
    queryKey: ["/api/admin/pricing-tiers"],
  });

  // Fetch membership tier definitions for dynamic tier options
  const { data: tierDefinitions } = useQuery<MembershipTierDefinition[]>({
    queryKey: ["/api/admin/membership-tiers"],
  });

  // Helper to invalidate all pricing-related queries (admin + public)
  const invalidatePricingQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-tiers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/pricing-tiers"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/pricing-tiers", data);
    },
    onSuccess: () => {
      invalidatePricingQueries();
      toast({ title: "Pricing tier created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create pricing tier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/pricing-tiers/${id}`, data);
    },
    onSuccess: () => {
      invalidatePricingQueries();
      toast({ title: "Pricing tier updated successfully" });
      setIsDialogOpen(false);
      setEditingTier(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update pricing tier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/pricing-tiers/${id}`);
    },
    onSuccess: () => {
      invalidatePricingQueries();
      toast({ title: "Pricing tier deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete pricing tier", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      tier: "SILVER",
      price: 0,
      billingPeriod: "yearly",
      benefits: [],
      isPopular: false,
      sortOrder: 0,
      isActive: true,
    });
    setBenefitInput("");
  };

  const handleEdit = (tier: PricingTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      tier: tier.tier,
      price: tier.price,
      billingPeriod: tier.billingPeriod || "yearly",
      benefits: tier.benefits || [],
      isPopular: tier.isPopular || false,
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
      benefits: formData.benefits.filter((_, i) => i !== index),
    });
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "FOUNDING":
        return <Badge className="bg-amber-600">Founding</Badge>;
      case "GOLD":
        return <Badge className="bg-yellow-500">Gold</Badge>;
      case "SILVER":
        return <Badge className="bg-gray-400">Silver</Badge>;
      default:
        return <Badge variant="secondary">Guest</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Pricing Tiers">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pricing Tiers">
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground">
              Manage membership pricing tiers and their benefits.
            </p>
            <Link href={`/${adminPath}/membership-tiers`}>
              <Button variant="link" size="sm" className="p-0 h-auto text-primary" data-testid="link-manage-tiers">
                <Settings className="w-3 h-3 mr-1" /> Manage Tier Definitions
              </Button>
            </Link>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTier(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-pricing-tier">
                <Plus className="w-4 h-4 mr-2" /> Add Pricing Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTier ? "Edit Pricing Tier" : "Add New Pricing Tier"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Founding Member"
                      data-testid="input-tier-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tier">Tier Level</Label>
                    <Select
                      value={formData.tier}
                      onValueChange={(value: typeof formData.tier) => setFormData({ ...formData, tier: value })}
                    >
                      <SelectTrigger data-testid="select-tier-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Only show tier definitions that match valid enum values */}
                        {tierDefinitions?.filter(t => t.isActive && ['founding', 'gold', 'silver', 'guest'].includes(t.slug.toLowerCase())).map((tier) => (
                          <SelectItem 
                            key={tier.id} 
                            value={tier.slug.toUpperCase()}
                            data-testid={`select-tier-${tier.slug}`}
                          >
                            {tier.displayName}
                          </SelectItem>
                        ))}
                        {/* Fallback if no matching tier definitions found */}
                        {(!tierDefinitions || tierDefinitions.filter(t => t.isActive && ['founding', 'gold', 'silver', 'guest'].includes(t.slug.toLowerCase())).length === 0) && (
                          <>
                            <SelectItem value="FOUNDING">Founding</SelectItem>
                            <SelectItem value="GOLD">Gold</SelectItem>
                            <SelectItem value="SILVER">Silver</SelectItem>
                            <SelectItem value="GUEST">Guest</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      data-testid="input-tier-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingPeriod">Billing Period</Label>
                    <Select
                      value={formData.billingPeriod}
                      onValueChange={(value) => setFormData({ ...formData, billingPeriod: value })}
                    >
                      <SelectTrigger data-testid="select-billing-period">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Button type="button" onClick={addBenefit} variant="secondary">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.benefits.map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-1">
                        {benefit}
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                          &times;
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
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPopular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                    />
                    <Label htmlFor="isPopular">Mark as Popular</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-tier"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingTier ? "Update" : "Create"}
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
                  <TableHead>Tier</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Benefits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pricingTiers?.map((tier) => (
                  <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                    <TableCell className="font-medium">
                      {tier.name}
                      {tier.isPopular && <Star className="inline w-4 h-4 ml-2 text-amber-500" />}
                    </TableCell>
                    <TableCell>{getTierBadge(tier.tier)}</TableCell>
                    <TableCell>PKR {tier.price.toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{tier.billingPeriod}</TableCell>
                    <TableCell>{tier.benefits?.length || 0} benefits</TableCell>
                    <TableCell>
                      {tier.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(tier)}
                        data-testid={`button-edit-tier-${tier.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this pricing tier?")) {
                            deleteMutation.mutate(tier.id);
                          }
                        }}
                        data-testid={`button-delete-tier-${tier.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!pricingTiers || pricingTiers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No pricing tiers found. Add your first tier to get started.
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
