import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Pencil, 
  Search, 
  Upload, 
  Loader2, 
  CheckCircle, 
  Users, 
  Info,
  Camera,
  Image as ImageIcon 
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@shared/schema";

const PROFILE_IMAGE_GUIDELINES = {
  dimensions: {
    recommended: "800 x 800 px (1:1 square)",
    minimum: "400 x 400 px",
    maximum: "2048 x 2048 px",
  },
  formats: ["JPEG", "PNG", "WebP"],
  maxFileSize: "5 MB",
  dpi: "72-150 DPI (web optimized)",
  tips: [
    "Use a well-lit, clear photo of the face",
    "Avoid filters or heavy editing",
    "Ensure the face is centered in the frame",
    "Use a neutral or solid background if possible",
    "Live selfie or camera capture is acceptable",
  ],
};

export default function MembersManagement() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    profileImageUrl: "",
    role: "USER" as string,
    isSafetyCertified: false,
    hasSignedWaiver: false,
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Member updated successfully" });
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update member", 
        description: error.message || "An error occurred",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      profileImageUrl: "",
      role: "USER",
      isSafetyCertified: false,
      hasSignedWaiver: false,
    });
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      setUploadedFile({ name: file.name, url: result.imageUrl });
      setFormData(prev => ({ ...prev, profileImageUrl: result.imageUrl }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      toast({
        title: "Upload successful",
        description: "Profile photo has been uploaded.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || "",
      profileImageUrl: user.profileImageUrl || "",
      role: user.role,
      isSafetyCertified: user.isSafetyCertified || false,
      hasSignedWaiver: user.hasSignedWaiver || false,
    });
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    }
  };

  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return "destructive";
      case "ADMIN": return "default";
      default: return "secondary";
    }
  };

  const getInitials = (user: User) => {
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || "?";
  };

  return (
    <AdminLayout title="Members Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-members-title">Members Management</h1>
            <p className="text-muted-foreground">
              View and manage member profiles, certifications, and profile photos
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Members ({filteredUsers?.length || 0})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-member-search"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id} data-testid={`row-member-${user.id}`}>
                      <TableCell>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profileImageUrl || undefined} alt={`${user.firstName} ${user.lastName}`} />
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() 
                          : <span className="text-muted-foreground">Not set</span>}
                      </TableCell>
                      <TableCell>{user.email || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>{user.phone || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.isSafetyCertified && (
                            <Badge variant="outline" className="text-xs">Safety</Badge>
                          )}
                          {user.hasSignedWaiver && (
                            <Badge variant="outline" className="text-xs">Waiver</Badge>
                          )}
                          {!user.isSafetyCertified && !user.hasSignedWaiver && (
                            <span className="text-muted-foreground text-sm">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          data-testid={`button-edit-member-${user.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Member Profile</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Profile Photo
                </Label>
                
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={formData.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xl">
                        {editingUser ? getInitials(editingUser) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-3">
                      <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="upload" data-testid="tab-upload">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </TabsTrigger>
                          <TabsTrigger value="url" data-testid="tab-url">
                            <ImageIcon className="w-4 h-4 mr-2" />
                            URL
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="upload" className="space-y-3 mt-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileUpload}
                            className="hidden"
                            data-testid="input-member-image-file"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full"
                            data-testid="button-upload-member-image"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Choose File or Take Selfie
                              </>
                            )}
                          </Button>
                          {uploadedFile && (
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              {uploadedFile.name}
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="url" className="space-y-3 mt-3">
                          <Input
                            value={formData.profileImageUrl}
                            onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                            placeholder="Enter image URL..."
                            data-testid="input-member-image-url"
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium">Image Guidelines:</p>
                        <ul className="list-disc ml-4 space-y-0.5">
                          <li>Dimensions: {PROFILE_IMAGE_GUIDELINES.dimensions.recommended}</li>
                          <li>Formats: {PROFILE_IMAGE_GUIDELINES.formats.join(", ")}</li>
                          <li>Max size: {PROFILE_IMAGE_GUIDELINES.maxFileSize}</li>
                          <li>DPI: {PROFILE_IMAGE_GUIDELINES.dpi}</li>
                        </ul>
                        <p className="font-medium mt-2">Tips:</p>
                        <ul className="list-disc ml-4 space-y-0.5">
                          {PROFILE_IMAGE_GUIDELINES.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    data-testid="input-member-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    data-testid="input-member-lastname"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  data-testid="input-member-phone"
                />
              </div>

              {isSuperAdmin ? (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger data-testid="select-member-role">
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/50">
                    <Badge variant={getRoleBadgeVariant(formData.role)}>
                      {formData.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">(Only super admins can change roles)</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-base font-medium">Certifications</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="safetyCertified" className="font-normal">Safety Certified</Label>
                      <p className="text-xs text-muted-foreground">Member has completed safety training</p>
                    </div>
                    <Switch
                      id="safetyCertified"
                      checked={formData.isSafetyCertified}
                      onCheckedChange={(checked) => setFormData({ ...formData, isSafetyCertified: checked })}
                      data-testid="switch-safety-certified"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="signedWaiver" className="font-normal">Signed Waiver</Label>
                      <p className="text-xs text-muted-foreground">Member has signed liability waiver</p>
                    </div>
                    <Switch
                      id="signedWaiver"
                      checked={formData.hasSignedWaiver}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasSignedWaiver: checked })}
                      data-testid="switch-signed-waiver"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-member"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
