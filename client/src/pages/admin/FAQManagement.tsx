import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdminLayout } from "./AdminLayout";
import type { FaqCategory, FaqItem } from "@shared/schema";

const categorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  icon: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

const itemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type ItemFormData = z.infer<typeof itemSchema>;

const iconOptions = [
  { value: "help-circle", label: "Help Circle" },
  { value: "users", label: "Users" },
  { value: "calendar", label: "Calendar" },
  { value: "credit-card", label: "Credit Card" },
  { value: "building-2", label: "Building" },
  { value: "shield", label: "Shield" },
  { value: "clock", label: "Clock" },
  { value: "settings", label: "Settings" },
];

export default function FAQManagement() {
  const { toast } = useToast();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "item"; id: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading: loadingCategories } = useQuery<FaqCategory[]>({
    queryKey: ["/api/admin/faq/categories"],
  });

  const { data: items = [], isLoading: loadingItems } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq/items"],
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: "",
      icon: "help-circle",
      sortOrder: 0,
      isActive: true,
    },
  });

  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      categoryId: "",
      question: "",
      answer: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return await apiRequest("POST", "/api/admin/faq/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/categories"] });
      toast({ title: "Category created successfully" });
      setCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/faq/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/categories"] });
      toast({ title: "Category updated successfully" });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/faq/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/items"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest("POST", "/api/admin/faq/items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/items"] });
      toast({ title: "FAQ item created successfully" });
      setItemDialogOpen(false);
      itemForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ItemFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/faq/items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/items"] });
      toast({ title: "FAQ item updated successfully" });
      setItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/faq/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq/items"] });
      toast({ title: "FAQ item deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openEditCategory = (category: FaqCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      title: category.title,
      icon: category.icon || "help-circle",
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive ?? true,
    });
    setCategoryDialogOpen(true);
  };

  const openEditItem = (item: FaqItem) => {
    setEditingItem(item);
    itemForm.reset({
      categoryId: item.categoryId,
      question: item.question,
      answer: item.answer,
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive ?? true,
    });
    setItemDialogOpen(true);
  };

  const handleCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleItemSubmit = (data: ItemFormData) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      deleteCategoryMutation.mutate(deleteTarget.id);
    } else {
      deleteItemMutation.mutate(deleteTarget.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getItemsForCategory = (categoryId: string) => {
    return items.filter(item => item.categoryId === categoryId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  };

  if (loadingCategories || loadingItems) {
    return (
      <AdminLayout title="FAQ Management">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="FAQ Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-faq-management-title">FAQ Management</h1>
            <p className="text-muted-foreground">Manage frequently asked questions and categories</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
              setCategoryDialogOpen(open);
              if (!open) {
                setEditingCategory(null);
                categoryForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                    <FormField
                      control={categoryForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-category-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="icon"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category-icon">
                                <SelectValue placeholder="Select an icon" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {iconOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sort Order</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-category-sort-order" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-category-active" />
                          </FormControl>
                          <Label>Active</Label>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} data-testid="button-save-category">
                      {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingCategory ? "Update" : "Create"} Category
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={itemDialogOpen} onOpenChange={(open) => {
              setItemDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                itemForm.reset();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-faq-item">
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit FAQ Item" : "Add FAQ Item"}</DialogTitle>
                </DialogHeader>
                <Form {...itemForm}>
                  <form onSubmit={itemForm.handleSubmit(handleItemSubmit)} className="space-y-4">
                    <FormField
                      control={itemForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-item-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-item-question" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={itemForm.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Answer</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={4} data-testid="input-item-answer" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4">
                      <FormField
                        control={itemForm.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Sort Order</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-item-sort-order" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 pt-8">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-item-active" />
                            </FormControl>
                            <Label>Active</Label>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createItemMutation.isPending || updateItemMutation.isPending} data-testid="button-save-item">
                      {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingItem ? "Update" : "Create"} FAQ Item
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No FAQ Categories</h3>
              <p className="text-muted-foreground mb-4">Create your first category to start adding FAQ items.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((category) => (
              <Card key={category.id} className="overflow-visible" data-testid={`card-category-${category.id}`}>
                <CardHeader className="cursor-pointer" onClick={() => toggleCategory(category.id)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {expandedCategories.has(category.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      {!category.isActive && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ({getItemsForCategory(category.id).length} items)
                      </span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => openEditCategory(category)} data-testid={`button-edit-category-${category.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => {
                        setDeleteTarget({ type: "category", id: category.id });
                        setDeleteDialogOpen(true);
                      }} data-testid={`button-delete-category-${category.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedCategories.has(category.id) && (
                  <CardContent className="pt-0">
                    {getItemsForCategory(category.id).length === 0 ? (
                      <p className="text-muted-foreground text-sm py-4">No FAQ items in this category.</p>
                    ) : (
                      <div className="space-y-2">
                        {getItemsForCategory(category.id).map((item) => (
                          <div key={item.id} className="border rounded-md p-4 flex items-start justify-between gap-4" data-testid={`item-faq-${item.id}`}>
                            <div className="flex-1">
                              <p className="font-medium">{item.question}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
                              {!item.isActive && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded mt-2 inline-block">Inactive</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditItem(item)} data-testid={`button-edit-item-${item.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => {
                                setDeleteTarget({ type: "item", id: item.id });
                                setDeleteDialogOpen(true);
                              }} data-testid={`button-delete-item-${item.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.type === "category"
                  ? "This will delete the category and all its FAQ items. This action cannot be undone."
                  : "This will delete the FAQ item. This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
