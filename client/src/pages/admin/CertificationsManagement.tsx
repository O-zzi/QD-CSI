import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Save, Award, Users, Calendar, XCircle, CheckCircle } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Certification, Facility, User } from "@shared/schema";

interface CertificationClass {
  id: string;
  certificationId: string;
  title: string;
  description: string | null;
  instructor: string | null;
  scheduledDate: string | null;
  duration: number;
  capacity: number;
  enrolledCount: number;
  price: number;
  location: string | null;
  isActive: boolean;
}

interface UserCertification {
  id: string;
  userId: string;
  certificationId: string;
  certificateNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  status: string;
  issuedBy: string | null;
  proofDocumentUrl: string | null;
  notes: string | null;
}

export default function CertificationsManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("certifications");
  
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [isCertDialogOpen, setIsCertDialogOpen] = useState(false);
  const [certFormData, setCertFormData] = useState({
    slug: "",
    name: "",
    description: "",
    facilityId: "",
    validityMonths: 12,
    requirements: "",
    icon: "",
    isActive: true,
    sortOrder: 0,
  });

  const [editingClass, setEditingClass] = useState<CertificationClass | null>(null);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);
  const [classFormData, setClassFormData] = useState({
    certificationId: "",
    title: "",
    description: "",
    instructor: "",
    scheduledDate: "",
    duration: 60,
    capacity: 10,
    price: 0,
    location: "",
    isActive: true,
  });

  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    userId: "",
    certificationId: "",
    notes: "",
  });

  const { data: certifications = [], isLoading: certsLoading } = useQuery<Certification[]>({
    queryKey: ["/api/admin/certifications"],
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery<CertificationClass[]>({
    queryKey: ["/api/admin/certification-classes"],
  });

  const { data: userCertifications = [], isLoading: userCertsLoading } = useQuery<UserCertification[]>({
    queryKey: ["/api/admin/user-certifications"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const createCertMutation = useMutation({
    mutationFn: async (data: typeof certFormData) => {
      return await apiRequest("POST", "/api/admin/certifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certifications"] });
      toast({ title: "Certification created successfully" });
      setIsCertDialogOpen(false);
      resetCertForm();
    },
    onError: () => {
      toast({ title: "Failed to create certification", variant: "destructive" });
    },
  });

  const updateCertMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof certFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/certifications/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certifications"] });
      toast({ title: "Certification updated successfully" });
      setIsCertDialogOpen(false);
      setEditingCert(null);
      resetCertForm();
    },
    onError: () => {
      toast({ title: "Failed to update certification", variant: "destructive" });
    },
  });

  const deleteCertMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/certifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certifications"] });
      toast({ title: "Certification deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete certification", variant: "destructive" });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: typeof classFormData) => {
      return await apiRequest("POST", "/api/admin/certification-classes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certification-classes"] });
      toast({ title: "Class created successfully" });
      setIsClassDialogOpen(false);
      resetClassForm();
    },
    onError: () => {
      toast({ title: "Failed to create class", variant: "destructive" });
    },
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof classFormData> }) => {
      return await apiRequest("PATCH", `/api/admin/certification-classes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certification-classes"] });
      toast({ title: "Class updated successfully" });
      setIsClassDialogOpen(false);
      setEditingClass(null);
      resetClassForm();
    },
    onError: () => {
      toast({ title: "Failed to update class", variant: "destructive" });
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/certification-classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certification-classes"] });
      toast({ title: "Class deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete class", variant: "destructive" });
    },
  });

  const issueCertMutation = useMutation({
    mutationFn: async (data: typeof issueFormData) => {
      return await apiRequest("POST", "/api/admin/user-certifications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-certifications"] });
      toast({ title: "Certification issued successfully" });
      setIsIssueDialogOpen(false);
      resetIssueForm();
    },
    onError: () => {
      toast({ title: "Failed to issue certification", variant: "destructive" });
    },
  });

  const revokeCertMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      return await apiRequest("POST", `/api/admin/user-certifications/${id}/revoke`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-certifications"] });
      toast({ title: "Certification revoked successfully" });
    },
    onError: () => {
      toast({ title: "Failed to revoke certification", variant: "destructive" });
    },
  });

  const resetCertForm = () => {
    setCertFormData({
      slug: "",
      name: "",
      description: "",
      facilityId: "",
      validityMonths: 12,
      requirements: "",
      icon: "",
      isActive: true,
      sortOrder: 0,
    });
  };

  const resetClassForm = () => {
    setClassFormData({
      certificationId: "",
      title: "",
      description: "",
      instructor: "",
      scheduledDate: "",
      duration: 60,
      capacity: 10,
      price: 0,
      location: "",
      isActive: true,
    });
  };

  const resetIssueForm = () => {
    setIssueFormData({
      userId: "",
      certificationId: "",
      notes: "",
    });
  };

  const handleEditCert = (cert: Certification) => {
    setEditingCert(cert);
    setCertFormData({
      slug: cert.slug,
      name: cert.name,
      description: cert.description || "",
      facilityId: cert.facilityId || "",
      validityMonths: cert.validityMonths || 12,
      requirements: cert.requirements || "",
      icon: cert.icon || "",
      isActive: cert.isActive ?? true,
      sortOrder: cert.sortOrder || 0,
    });
    setIsCertDialogOpen(true);
  };

  const handleEditClass = (cls: CertificationClass) => {
    setEditingClass(cls);
    setClassFormData({
      certificationId: cls.certificationId,
      title: cls.title,
      description: cls.description || "",
      instructor: cls.instructor || "",
      scheduledDate: cls.scheduledDate ? new Date(cls.scheduledDate).toISOString().slice(0, 16) : "",
      duration: cls.duration || 60,
      capacity: cls.capacity || 10,
      price: cls.price || 0,
      location: cls.location || "",
      isActive: cls.isActive ?? true,
    });
    setIsClassDialogOpen(true);
  };

  const handleSubmitCert = () => {
    if (editingCert) {
      updateCertMutation.mutate({ id: editingCert.id, data: certFormData });
    } else {
      createCertMutation.mutate(certFormData);
    }
  };

  const handleSubmitClass = () => {
    const submitData = {
      ...classFormData,
      scheduledDate: classFormData.scheduledDate ? new Date(classFormData.scheduledDate).toISOString() : "",
    };
    if (editingClass) {
      updateClassMutation.mutate({ id: editingClass.id, data: submitData });
    } else {
      createClassMutation.mutate(submitData);
    }
  };

  const getCertName = (certId: string) => {
    return certifications.find(c => c.id === certId)?.name || "Unknown";
  };

  const getFacilityName = (facilityId: string | null) => {
    if (!facilityId) return "-";
    return facilities.find(f => f.id === facilityId)?.name || "Unknown";
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Unknown";
  };

  const isLoading = certsLoading || classesLoading || userCertsLoading;

  if (isLoading) {
    return (
      <AdminLayout title="Certifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Certifications">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="certifications" className="gap-2">
            <Award className="w-4 h-4" />
            Types
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <Calendar className="w-4 h-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="user-certs" className="gap-2">
            <Users className="w-4 h-4" />
            Issued
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certifications" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Define certification types for restricted facilities like the Air Rifle Range.
            </p>
            <Dialog open={isCertDialogOpen} onOpenChange={(open) => {
              setIsCertDialogOpen(open);
              if (!open) {
                setEditingCert(null);
                resetCertForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-certification">
                  <Plus className="w-4 h-4 mr-2" /> Add Certification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCert ? "Edit Certification" : "Add New Certification"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cert-name">Name</Label>
                      <Input
                        id="cert-name"
                        value={certFormData.name}
                        onChange={(e) => setCertFormData({ ...certFormData, name: e.target.value })}
                        placeholder="Air Rifle Safety Certification"
                        data-testid="input-cert-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cert-slug">Slug</Label>
                      <Input
                        id="cert-slug"
                        value={certFormData.slug}
                        onChange={(e) => setCertFormData({ ...certFormData, slug: e.target.value })}
                        placeholder="air-rifle-safety"
                        data-testid="input-cert-slug"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-description">Description</Label>
                    <Textarea
                      id="cert-description"
                      value={certFormData.description}
                      onChange={(e) => setCertFormData({ ...certFormData, description: e.target.value })}
                      rows={3}
                      data-testid="input-cert-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cert-facility">Linked Facility</Label>
                      <Select
                        value={certFormData.facilityId}
                        onValueChange={(value) => setCertFormData({ ...certFormData, facilityId: value })}
                      >
                        <SelectTrigger data-testid="select-cert-facility">
                          <SelectValue placeholder="Select facility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {facilities.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cert-validity">Validity (months)</Label>
                      <Input
                        id="cert-validity"
                        type="number"
                        value={certFormData.validityMonths}
                        onChange={(e) => setCertFormData({ ...certFormData, validityMonths: parseInt(e.target.value) || 12 })}
                        data-testid="input-cert-validity"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-requirements">Requirements</Label>
                    <Textarea
                      id="cert-requirements"
                      value={certFormData.requirements}
                      onChange={(e) => setCertFormData({ ...certFormData, requirements: e.target.value })}
                      placeholder="Must complete safety course, pass written exam, demonstrate proper handling..."
                      rows={3}
                      data-testid="input-cert-requirements"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cert-icon">Icon (lucide icon name)</Label>
                      <Input
                        id="cert-icon"
                        value={certFormData.icon}
                        onChange={(e) => setCertFormData({ ...certFormData, icon: e.target.value })}
                        placeholder="shield-check"
                        data-testid="input-cert-icon"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cert-sort">Sort Order</Label>
                      <Input
                        id="cert-sort"
                        type="number"
                        value={certFormData.sortOrder}
                        onChange={(e) => setCertFormData({ ...certFormData, sortOrder: parseInt(e.target.value) || 0 })}
                        data-testid="input-cert-sort"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="cert-active"
                      checked={certFormData.isActive}
                      onCheckedChange={(checked) => setCertFormData({ ...certFormData, isActive: checked })}
                      data-testid="switch-cert-active"
                    />
                    <Label htmlFor="cert-active">Active</Label>
                  </div>
                  <Button
                    onClick={handleSubmitCert}
                    disabled={createCertMutation.isPending || updateCertMutation.isPending}
                    data-testid="button-submit-cert"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingCert ? "Update" : "Create"} Certification
                  </Button>
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
                    <TableHead>Facility</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No certifications defined yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    certifications.map(cert => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-medium">{cert.name}</TableCell>
                        <TableCell>{getFacilityName(cert.facilityId)}</TableCell>
                        <TableCell>{cert.validityMonths} months</TableCell>
                        <TableCell>
                          <Badge variant={cert.isActive ? "default" : "secondary"}>
                            {cert.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditCert(cert)} data-testid={`button-edit-cert-${cert.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteCertMutation.mutate(cert.id)} data-testid={`button-delete-cert-${cert.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              Schedule certification classes and training sessions.
            </p>
            <Dialog open={isClassDialogOpen} onOpenChange={(open) => {
              setIsClassDialogOpen(open);
              if (!open) {
                setEditingClass(null);
                resetClassForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-class">
                  <Plus className="w-4 h-4 mr-2" /> Schedule Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingClass ? "Edit Class" : "Schedule New Class"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="class-cert">Certification Type</Label>
                    <Select
                      value={classFormData.certificationId}
                      onValueChange={(value) => setClassFormData({ ...classFormData, certificationId: value })}
                    >
                      <SelectTrigger data-testid="select-class-cert">
                        <SelectValue placeholder="Select certification" />
                      </SelectTrigger>
                      <SelectContent>
                        {certifications.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-title">Class Title</Label>
                    <Input
                      id="class-title"
                      value={classFormData.title}
                      onChange={(e) => setClassFormData({ ...classFormData, title: e.target.value })}
                      placeholder="Air Rifle Safety Fundamentals"
                      data-testid="input-class-title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class-date">Scheduled Date/Time</Label>
                      <Input
                        id="class-date"
                        type="datetime-local"
                        value={classFormData.scheduledDate}
                        onChange={(e) => setClassFormData({ ...classFormData, scheduledDate: e.target.value })}
                        data-testid="input-class-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class-duration">Duration (minutes)</Label>
                      <Input
                        id="class-duration"
                        type="number"
                        value={classFormData.duration}
                        onChange={(e) => setClassFormData({ ...classFormData, duration: parseInt(e.target.value) || 60 })}
                        data-testid="input-class-duration"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class-instructor">Instructor</Label>
                      <Input
                        id="class-instructor"
                        value={classFormData.instructor}
                        onChange={(e) => setClassFormData({ ...classFormData, instructor: e.target.value })}
                        data-testid="input-class-instructor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class-location">Location</Label>
                      <Input
                        id="class-location"
                        value={classFormData.location}
                        onChange={(e) => setClassFormData({ ...classFormData, location: e.target.value })}
                        placeholder="Range Training Room"
                        data-testid="input-class-location"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class-capacity">Capacity</Label>
                      <Input
                        id="class-capacity"
                        type="number"
                        value={classFormData.capacity}
                        onChange={(e) => setClassFormData({ ...classFormData, capacity: parseInt(e.target.value) || 10 })}
                        data-testid="input-class-capacity"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class-price">Price (PKR)</Label>
                      <Input
                        id="class-price"
                        type="number"
                        value={classFormData.price}
                        onChange={(e) => setClassFormData({ ...classFormData, price: parseInt(e.target.value) || 0 })}
                        data-testid="input-class-price"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-description">Description</Label>
                    <Textarea
                      id="class-description"
                      value={classFormData.description}
                      onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                      rows={2}
                      data-testid="input-class-description"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="class-active"
                      checked={classFormData.isActive}
                      onCheckedChange={(checked) => setClassFormData({ ...classFormData, isActive: checked })}
                      data-testid="switch-class-active"
                    />
                    <Label htmlFor="class-active">Active</Label>
                  </div>
                  <Button
                    onClick={handleSubmitClass}
                    disabled={createClassMutation.isPending || updateClassMutation.isPending}
                    data-testid="button-submit-class"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingClass ? "Update" : "Schedule"} Class
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No classes scheduled yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    classes.map(cls => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.title}</TableCell>
                        <TableCell>{getCertName(cls.certificationId)}</TableCell>
                        <TableCell>
                          {cls.scheduledDate ? new Date(cls.scheduledDate).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>{cls.instructor || "-"}</TableCell>
                        <TableCell>{cls.enrolledCount}/{cls.capacity}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEditClass(cls)} data-testid={`button-edit-class-${cls.id}`}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteClassMutation.mutate(cls.id)} data-testid={`button-delete-class-${cls.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-certs" className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">
              View and manage issued user certifications.
            </p>
            <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-issue-cert">
                  <Plus className="w-4 h-4 mr-2" /> Issue Certification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue Certification to User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue-user">User</Label>
                    <Select
                      value={issueFormData.userId}
                      onValueChange={(value) => setIssueFormData({ ...issueFormData, userId: value })}
                    >
                      <SelectTrigger data-testid="select-issue-user">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue-cert">Certification</Label>
                    <Select
                      value={issueFormData.certificationId}
                      onValueChange={(value) => setIssueFormData({ ...issueFormData, certificationId: value })}
                    >
                      <SelectTrigger data-testid="select-issue-cert">
                        <SelectValue placeholder="Select certification" />
                      </SelectTrigger>
                      <SelectContent>
                        {certifications.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue-notes">Notes</Label>
                    <Textarea
                      id="issue-notes"
                      value={issueFormData.notes}
                      onChange={(e) => setIssueFormData({ ...issueFormData, notes: e.target.value })}
                      placeholder="Optional notes about this certification"
                      data-testid="input-issue-notes"
                    />
                  </div>
                  <Button
                    onClick={() => issueCertMutation.mutate(issueFormData)}
                    disabled={issueCertMutation.isPending || !issueFormData.userId || !issueFormData.certificationId}
                    data-testid="button-submit-issue"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Issue Certification
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Certificate #</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCertifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No certifications issued yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    userCertifications.map(uc => (
                      <TableRow key={uc.id}>
                        <TableCell className="font-medium">{getUserName(uc.userId)}</TableCell>
                        <TableCell>{getCertName(uc.certificationId)}</TableCell>
                        <TableCell className="font-mono text-sm">{uc.certificateNumber || "-"}</TableCell>
                        <TableCell>
                          {uc.issuedAt ? new Date(uc.issuedAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          {uc.expiresAt ? new Date(uc.expiresAt).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={uc.status === "ACTIVE" ? "default" : uc.status === "REVOKED" ? "destructive" : "secondary"}>
                            {uc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {uc.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => revokeCertMutation.mutate({ id: uc.id })}
                              data-testid={`button-revoke-${uc.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
