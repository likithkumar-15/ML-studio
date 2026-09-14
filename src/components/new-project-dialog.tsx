import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { useProfile } from "@/lib/queries";
import { PROBLEM_TYPES, type ProblemType } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

export function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [problemType, setProblemType] = useState<ProblemType>(
    (profile?.default_problem_type as ProblemType) ?? "classification",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (name.trim().length < 3) {
      setError("Please give the project a name of at least 3 characters.");
      return;
    }
    setError("");
    setSaving(true);
    const { data, error: insertError } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        problem_type: problemType,
        status: "draft",
      })
      .select()
      .single();
    setSaving(false);

    if (insertError || !data) {
      toast.error("We couldn't create the project. Please try again.");
      return;
    }

    await logActivity({
      userId: user.id,
      projectId: data.id,
      projectName: data.name,
      action: "Project created",
    });
    await queryClient.invalidateQueries();
    toast.success("Project created.");
    onOpenChange(false);
    setName("");
    setDescription("");
    navigate({
      to: "/projects/$projectId",
      params: { projectId: data.id },
      search: { tab: "dataset" },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            A project holds one dataset, its preprocessing, models and experiments.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Loan Approval Predictor"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Predict whether a loan application should be approved."
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="problem-type">Problem type</Label>
            <Select value={problemType} onValueChange={(v) => setProblemType(v as ProblemType)}>
              <SelectTrigger id="problem-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROBLEM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label} — {type.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
