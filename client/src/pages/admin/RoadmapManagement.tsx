import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Save, 
  ExternalLink, 
  Eye, 
  CheckCircle, 
  Clock, 
  Hammer, 
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { ConstructionPhase } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function RoadmapManagement() {
  const { toast } = useToast();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [editingPhase, setEditingPhase] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, Partial<ConstructionPhase>>>({});

  const { data: phases, isLoading } = useQuery<ConstructionPhase[]>({
    queryKey: ["/api/admin/construction-phases"],
  });

  useEffect(() => {
    if (phases) {
      const initial: Record<string, Partial<ConstructionPhase>> = {};
      phases.forEach((phase) => {
        initial[phase.id] = { ...phase };
      });
      setFormData(initial);
    }
  }, [phases]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConstructionPhase> }) => {
      const updateData = {
        ...data,
        progress: data.progress !== undefined ? Number(data.progress) : undefined,
        isActive: data.status === 'IN_PROGRESS',
        isComplete: data.status === 'COMPLETE' || data.progress === 100,
      };
      return await apiRequest("PATCH", `/api/admin/construction-phases/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/construction-phases"] });
      toast({ title: "Phase updated successfully" });
      setEditingPhase(null);
    },
    onError: () => {
      toast({ title: "Failed to update phase", variant: "destructive" });
    },
  });

  const handleFieldChange = (phaseId: string, field: keyof ConstructionPhase, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [phaseId]: {
        ...prev[phaseId],
        [field]: value,
      },
    }));
  };

  const handleMilestoneToggle = (phaseId: string, milestoneIndex: number) => {
    const phase = formData[phaseId];
    if (!phase || !phase.milestones) return;

    const updatedMilestones = [...(phase.milestones as string[])];
    const milestone = updatedMilestones[milestoneIndex];

    if (milestone.startsWith('[x]')) {
      updatedMilestones[milestoneIndex] = milestone.replace('[x]', '[ ]');
    } else if (milestone.startsWith('[ ]')) {
      updatedMilestones[milestoneIndex] = milestone.replace('[ ]', '[x]');
    } else {
      updatedMilestones[milestoneIndex] = `[x] ${milestone}`;
    }

    const completedCount = updatedMilestones.filter(m => m.startsWith('[x]')).length;
    const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);

    setFormData((prev) => ({
      ...prev,
      [phaseId]: {
        ...prev[phaseId],
        milestones: updatedMilestones,
        progress: newProgress,
        status: newProgress === 100 ? 'COMPLETE' : newProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        isComplete: newProgress === 100,
        isActive: newProgress > 0 && newProgress < 100,
      },
    }));
  };

  const handleSave = (phaseId: string) => {
    updateMutation.mutate({ id: phaseId, data: formData[phaseId] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Hammer className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return <Badge className="bg-green-500">Complete</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-amber-500">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const calculateOverallProgress = () => {
    if (!phases || phases.length === 0) return 0;
    const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
    return Math.round(totalProgress / phases.length);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Construction Status">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Construction Status">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-muted-foreground">
              Manage construction phases and milestones. Changes automatically update the public roadmap.
            </p>
            <a
              href="/roadmap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
            >
              <Eye className="w-3 h-3" /> View Public Roadmap
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Overall Project Progress</CardTitle>
            <CardDescription>
              Combined progress across all construction phases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{calculateOverallProgress()}%</span>
                <span className="text-muted-foreground">
                  {phases?.filter(p => p.status === 'COMPLETE').length || 0} of {phases?.length || 0} phases complete
                </span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {phases?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((phase) => {
            const currentData = formData[phase.id] || phase;
            const isEditing = editingPhase === phase.id;
            
            return (
              <Card key={phase.id} className={`transition-all ${isEditing ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(currentData.status as string)}
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {currentData.label}: {currentData.title}
                          {getStatusBadge(currentData.status as string)}
                        </CardTitle>
                        <CardDescription>
                          {currentData.timeframe || 'No timeframe set'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{currentData.progress || 0}%</span>
                      <Button
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingPhase(isEditing ? null : phase.id)}
                        data-testid={`button-edit-phase-${phase.id}`}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                      {isEditing && (
                        <Button
                          size="sm"
                          onClick={() => handleSave(phase.id)}
                          disabled={updateMutation.isPending}
                          data-testid={`button-save-phase-${phase.id}`}
                        >
                          <Save className="w-4 h-4 mr-1" /> Save
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={currentData.progress || 0} className="mt-3" />
                </CardHeader>

                {isEditing && (
                  <CardContent className="border-t pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phase Label</Label>
                        <Input
                          value={currentData.label || ''}
                          onChange={(e) => handleFieldChange(phase.id, 'label', e.target.value)}
                          data-testid={`input-phase-label-${phase.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phase Title</Label>
                        <Input
                          value={currentData.title || ''}
                          onChange={(e) => handleFieldChange(phase.id, 'title', e.target.value)}
                          data-testid={`input-phase-title-${phase.id}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={currentData.status as string}
                          onValueChange={(value) => {
                            const newProgress = value === 'COMPLETE' ? 100 : value === 'NOT_STARTED' ? 0 : currentData.progress;
                            handleFieldChange(phase.id, 'status', value);
                            handleFieldChange(phase.id, 'progress', newProgress);
                            handleFieldChange(phase.id, 'isComplete', value === 'COMPLETE');
                            handleFieldChange(phase.id, 'isActive', value === 'IN_PROGRESS');
                          }}
                        >
                          <SelectTrigger data-testid={`select-phase-status-${phase.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETE">Complete</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Progress (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={currentData.progress || 0}
                          onChange={(e) => {
                            const progress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                            handleFieldChange(phase.id, 'progress', progress);
                            if (progress === 100) {
                              handleFieldChange(phase.id, 'status', 'COMPLETE');
                              handleFieldChange(phase.id, 'isComplete', true);
                              handleFieldChange(phase.id, 'isActive', false);
                            } else if (progress > 0) {
                              handleFieldChange(phase.id, 'status', 'IN_PROGRESS');
                              handleFieldChange(phase.id, 'isComplete', false);
                              handleFieldChange(phase.id, 'isActive', true);
                            } else {
                              handleFieldChange(phase.id, 'status', 'NOT_STARTED');
                              handleFieldChange(phase.id, 'isComplete', false);
                              handleFieldChange(phase.id, 'isActive', false);
                            }
                          }}
                          data-testid={`input-phase-progress-${phase.id}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Timeframe</Label>
                        <Input
                          value={currentData.timeframe || ''}
                          onChange={(e) => handleFieldChange(phase.id, 'timeframe', e.target.value)}
                          placeholder="e.g., March - August 2024"
                          data-testid={`input-phase-timeframe-${phase.id}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Milestones (one per line)</Label>
                      <Textarea
                        value={(currentData.milestones as string[] || []).join('\n')}
                        onChange={(e) => handleFieldChange(phase.id, 'milestones', e.target.value.split('\n').filter(m => m.trim()))}
                        rows={4}
                        placeholder="Enter milestones, one per line"
                        data-testid={`input-phase-milestones-${phase.id}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        Prefix with [x] for completed milestones, [ ] for pending
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Highlights (one per line)</Label>
                      <Textarea
                        value={(currentData.highlights as string[] || []).join('\n')}
                        onChange={(e) => handleFieldChange(phase.id, 'highlights', e.target.value.split('\n').filter(h => h.trim()))}
                        rows={2}
                        placeholder="Key achievements or notes"
                        data-testid={`input-phase-highlights-${phase.id}`}
                      />
                    </div>
                  </CardContent>
                )}

                {!isEditing && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Milestones</h4>
                        <ul className="space-y-1">
                          {(currentData.milestones as string[] || []).slice(0, 4).map((milestone, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <CheckCircle className={`w-3 h-3 ${milestone.startsWith('[x]') ? 'text-green-500' : 'text-muted-foreground'}`} />
                              <span className={milestone.startsWith('[x]') ? 'line-through text-muted-foreground' : ''}>
                                {milestone.replace(/^\[(x| )\] /, '')}
                              </span>
                            </li>
                          ))}
                          {(currentData.milestones as string[] || []).length > 4 && (
                            <li className="text-sm text-muted-foreground">
                              +{(currentData.milestones as string[]).length - 4} more...
                            </li>
                          )}
                        </ul>
                      </div>
                      {(currentData.highlights as string[] || []).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Highlights</h4>
                          <ul className="space-y-1">
                            {(currentData.highlights as string[] || []).map((highlight, i) => (
                              <li key={i} className="text-sm text-muted-foreground">
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-2">
              Construction phases are automatically synced with the public roadmap page.
            </p>
            <p className="text-sm text-muted-foreground">
              When you update progress or mark milestones as complete, the changes will be immediately visible to visitors.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
