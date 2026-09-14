import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppWindow, Maximize2, Trash2 } from "lucide-react";

import { EmptyState, PageHeader, SectionCard, SimulationBadge } from "@/components/common";
import { PredictionForm } from "@/components/prediction-form";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { fieldsFromExperiment } from "@/lib/predict";
import {
  useDataset,
  useDeployments,
  useExperiments,
  useGeneratedApps,
  useProjects,
} from "@/lib/queries";
import { formatDateTime } from "@/lib/workflow";

export const Route = createFileRoute("/_app/app-builder")({
  head: () => ({
    meta: [
      { title: "App Builder — ML Studio" },
      {
        name: "description",
        content:
          "Turn a deployed model into a working ML-driven application with generated input fields.",
      },
      { property: "og:title", content: "App Builder — ML Studio" },
      {
        property: "og:description",
        content: "Turn a deployed model into a working prediction application.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppBuilderPage,
});

function AppBuilderPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const projects = useProjects();
  const deployments = useDeployments();
  const experiments = useExperiments();
  const apps = useGeneratedApps();

  const [projectId, setProjectId] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const projectDeployments = (deployments.data ?? []).filter((d) => d.project_id === projectId);
  const deployment = projectDeployments.find((d) => d.id === deploymentId) ?? null;
  const experiment = experiments.data?.find((e) => e.id === deployment?.experiment_id) ?? null;
  const dataset = useDataset(projectId);
  const fields = useMemo(
    () => fieldsFromExperiment(experiment, dataset.data ?? null),
    [experiment, dataset.data],
  );

  useEffect(() => {
    if (!projectId && (deployments.data ?? []).length > 0) {
      setProjectId(deployments.data![0]!.project_id);
    }
  }, [deployments.data, projectId]);

  useEffect(() => {
    if (projectDeployments.length && !projectDeployments.some((d) => d.id === deploymentId)) {
      setDeploymentId(projectDeployments[0]!.id);
    }
  }, [projectDeployments, deploymentId]);

  useEffect(() => {
    if (!name && projectId) {
      const project = projects.data?.find((p) => p.id === projectId);
      if (project) setName(`${project.name.replace(/\s*\(Demo\)$/, "")} App`);
    }
  }, [projectId, projects.data, name]);

  const save = async () => {
    if (!user || !deployment) return;
    if (name.trim().length < 3) {
      toast.error("Please give the application a name.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("generated_apps").insert({
      user_id: user.id,
      project_id: deployment.project_id,
      deployment_id: deployment.id,
      name: name.trim(),
      description: description.trim() || null,
      fields,
    });
    setSaving(false);
    if (error) {
      toast.error("We couldn't save this application. Please try again.");
      return;
    }
    await logActivity({
      userId: user.id,
      projectId: deployment.project_id,
      projectName: projects.data?.find((p) => p.id === deployment.project_id)?.name ?? null,
      action: "Application created",
    });
    await queryClient.invalidateQueries();
    toast.success("Application saved.");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("generated_apps").delete().eq("id", id);
    if (error) {
      toast.error("We couldn't delete that application.");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Application deleted.");
  };

  const noDeployments = (deployments.data ?? []).length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Builder"
        description="Turn a deployed model into a working application with generated input fields."
      />

      {noDeployments ? (
        <SectionCard>
          <EmptyState
            icon={<AppWindow className="size-5" />}
            title="No deployments to build on"
            description="Deploy a trained model first — the app builder generates its inputs from that model."
            action={
              <Button asChild>
                <Link to="/projects">Go to projects</Link>
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <SectionCard title="Configure" description="Choose the model and describe the app.">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set((deployments.data ?? []).map((d) => d.project_id))).map(
                      (id) => (
                        <SelectItem key={id} value={id}>
                          {projects.data?.find((p) => p.id === id)?.name ?? "Project"}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deployment</Label>
                <Select value={deploymentId} onValueChange={setDeploymentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select deployment" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectDeployments.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} · {item.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-name">Application name</Label>
                <Input id="app-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="app-description">Application description</Label>
                <Textarea
                  id="app-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter customer information to check the likely outcome."
                />
              </div>
              <Button className="w-full" onClick={save} disabled={saving || !deployment}>
                {saving ? "Saving…" : "Save Application"}
              </Button>
            </div>
          </SectionCard>

          <SectionCard
            title="Live preview"
            description="Exactly what the saved application will look like."
            actions={<SimulationBadge label="Simulated predictions" />}
          >
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-semibold tracking-tight">
                {name || "Untitled application"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {description || "Enter the information below to get a prediction."}
              </p>
              <div className="mt-6">
                <PredictionForm
                  fields={fields}
                  experiment={experiment}
                  dataset={dataset.data ?? null}
                  submitLabel="Predict"
                  showJson={false}
                />
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <SectionCard title="Saved applications" bodyClassName="p-0">
        {(apps.data ?? []).length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<AppWindow className="size-5" />}
              title="No applications yet"
              description="Save a generated application to open it in presentation mode."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(apps.data ?? []).map((app) => (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{app.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {projects.data?.find((p) => p.id === app.project_id)?.name ?? "Project"} ·
                    created {formatDateTime(app.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/apps/$appId" params={{ appId: app.id }}>
                      <Maximize2 className="size-3.5" /> Open full screen
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(app.id)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
