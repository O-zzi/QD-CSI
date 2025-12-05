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
import { Plus, Pencil, Trash2, Save, Calendar, Users, Clock } from "lucide-react";
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
import { format } from "date-fns";
import type { Event, Facility } from "@shared/schema";

export default function EventsManagement() {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    facilityId: "",
    title: "",
    description: "",
    type: "CLASS" as "ACADEMY" | "TOURNAMENT" | "CLASS" | "SOCIAL",
    instructor: "",
    scheduleDay: "",
    scheduleTime: "",
    scheduleDatetime: "",
    price: 0,
    capacity: 20,
    enrollmentDeadline: "",
    imageUrl: "",
    slug: "",
    isActive: true,
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ["/api/admin/facilities"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event updated successfully" });
      setIsDialogOpen(false);
      setEditingEvent(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      facilityId: facilities?.[0]?.id || "",
      title: "",
      description: "",
      type: "CLASS",
      instructor: "",
      scheduleDay: "",
      scheduleTime: "",
      scheduleDatetime: "",
      price: 0,
      capacity: 20,
      enrollmentDeadline: "",
      imageUrl: "",
      slug: "",
      isActive: true,
    });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      facilityId: event.facilityId,
      title: event.title,
      description: event.description || "",
      type: event.type,
      instructor: event.instructor || "",
      scheduleDay: event.scheduleDay || "",
      scheduleTime: event.scheduleTime || "",
      scheduleDatetime: event.scheduleDatetime ? format(new Date(event.scheduleDatetime), "yyyy-MM-dd'T'HH:mm") : "",
      price: event.price || 0,
      capacity: event.capacity || 20,
      enrollmentDeadline: event.enrollmentDeadline ? format(new Date(event.enrollmentDeadline), "yyyy-MM-dd") : "",
      imageUrl: event.imageUrl || "",
      slug: event.slug || "",
      isActive: event.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.facilityId) {
      toast({ title: "Please select a facility", variant: "destructive" });
      return;
    }
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ACADEMY":
        return <Badge className="bg-purple-500">Academy</Badge>;
      case "TOURNAMENT":
        return <Badge className="bg-orange-500">Tournament</Badge>;
      case "CLASS":
        return <Badge className="bg-blue-500">Class</Badge>;
      case "SOCIAL":
        return <Badge className="bg-green-500">Social</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getFacilityName = (facilityId: string) => {
    return facilities?.find(f => f.id === facilityId)?.name || "Unknown";
  };

  if (isLoading) {
    return (
      <AdminLayout title="Events & Academies">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Events & Academies">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage events, academies, tournaments, and classes at The Quarterdeck.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingEvent(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-event">
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Beginner Padel Academy"
                      data-testid="input-event-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Event Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: typeof formData.type) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger data-testid="select-event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACADEMY">Academy (Ongoing Program)</SelectItem>
                        <SelectItem value="TOURNAMENT">Tournament</SelectItem>
                        <SelectItem value="CLASS">Class (One-time)</SelectItem>
                        <SelectItem value="SOCIAL">Social Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facilityId">Facility</Label>
                    <Select
                      value={formData.facilityId}
                      onValueChange={(value) => setFormData({ ...formData, facilityId: value })}
                    >
                      <SelectTrigger data-testid="select-event-facility">
                        <SelectValue placeholder="Select facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities?.map((facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor/Host</Label>
                    <Input
                      id="instructor"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      placeholder="e.g., Coach Ahmad"
                      data-testid="input-event-instructor"
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
                    placeholder="Describe the event, what participants will learn, etc."
                    data-testid="input-event-description"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDay">Schedule Day</Label>
                    <Input
                      id="scheduleDay"
                      value={formData.scheduleDay}
                      onChange={(e) => setFormData({ ...formData, scheduleDay: e.target.value })}
                      placeholder="e.g., Mon, Wed, Fri"
                      data-testid="input-event-schedule-day"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Schedule Time</Label>
                    <Input
                      id="scheduleTime"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                      placeholder="e.g., 6:00 PM - 8:00 PM"
                      data-testid="input-event-schedule-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDatetime">Specific Date/Time</Label>
                    <Input
                      id="scheduleDatetime"
                      type="datetime-local"
                      value={formData.scheduleDatetime}
                      onChange={(e) => setFormData({ ...formData, scheduleDatetime: e.target.value })}
                      data-testid="input-event-datetime"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      data-testid="input-event-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 20 })}
                      data-testid="input-event-capacity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentDeadline">Enrollment Deadline</Label>
                    <Input
                      id="enrollmentDeadline"
                      type="date"
                      value={formData.enrollmentDeadline}
                      onChange={(e) => setFormData({ ...formData, enrollmentDeadline: e.target.value })}
                      data-testid="input-event-deadline"
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
                    data-testid="input-event-image"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="beginner-padel-academy"
                      data-testid="input-event-slug"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active (visible on website)</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-event"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingEvent ? "Update" : "Create"}
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
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        {event.instructor && (
                          <div className="text-sm text-muted-foreground">
                            by {event.instructor}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(event.type)}</TableCell>
                    <TableCell>{getFacilityName(event.facilityId)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {event.scheduleDay && (
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3" />
                            {event.scheduleDay}
                          </span>
                        )}
                        {event.scheduleTime && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {event.scheduleTime}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.enrolledCount || 0}/{event.capacity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {event.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(event)}
                        data-testid={`button-edit-event-${event.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this event?")) {
                            deleteMutation.mutate(event.id);
                          }
                        }}
                        data-testid={`button-delete-event-${event.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!events || events.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No events found. Add your first event to get started.
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
