import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";

import { LoadingRows, PageHeader, SectionCard, StatusPill } from "@/components/common";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { DatasetSection } from "@/components/workspace/dataset-section";
import { DeploySection } from "@/components/workspace/deploy-section";
import { ModelSection } from "@/components/workspace/model-section";
import { PerformanceSection } from "@/components/workspace/performance-section";
import { PreprocessingSection } from "@/components/workspace/preprocessing-section";
import { TestSection } from "@/components/workspace/test-section";
import { TrainingSection } from "@/components/workspace/training-section";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/db";
import { formatMetric, primaryMetric } from "@/lib/ml/engine";
import { modelById } from "@/lib/ml/models";
import {
  useDataset,
  useDeployments,
  useExperiments,
  useGeneratedApps,
  useModelConfig,
  useProject,
} from "@/lib/queries";
import { PROBLEM_TYPES, PROJECT_STATUSES } from "@/lib/types";
import type { Metrics } from "@/lib/types";
import { formatDateTime, workflowStages } from "@/lib/workflow";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "dataset", label: "Dataset" },
  { value: "preprocessing", label: "Preprocessing" },
  { value: "model", label: "Model" },
  { value: "training", label: "Training" },
  { value: "performance", label: "Performance" },
  { value: "test", label: "Test" },
  { value: "deploy", label: "Deploy" },
  { value: "settings", label: "Settings" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const searchSchema = z.object({
  tab: z
    .enum([
      "overview",
      "dataset",
      "preprocessing",
      "model",
      "training",
      "performance",
      "test",
      "deploy",
      "settings",
    ])
    .optional(),
});

export const Route = createFileRoute("/_app/projects/$projectId")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Project workspace — ML Studio" },
      {
        name: "description",
        content:
          "Move a machine learning project from dataset to preprocessing, training, evaluation and deployment.",
      },
      { property: "og:title", content: "Project workspace — ML Studio" },
      {
        property: "og:description",
        content: "Dataset, training, evaluation and deployment in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectWorkspace,
});

function ProjectWorkspace() {
  const { projectId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const activeTab: TabValue = tab ?? "overview";

  const projectQuery = useProject(projectId);
  const dataset = useDataset(projectId);
  const modelConfig = useModelConfig(projectId);
  const experiments = useExperiments(projectId);
  const deployments = useDeployments(projectId);
  const apps = useGeneratedApps();

  const setTab = (value: string) => {
    navigate({
      to: "/projects/$projectId",
      params: { projectId },
      search: { tab: value as TabValue },
    });
  };

  if (projectQuery.isLoading) {
    return <LoadingRows rows={4} />;
  }

  const project = projectQuery.data;
  if (!project) {
    return (
      <SectionCard title="Project not found">
        <p className="text-sm text-muted-foreground">
          This project no longer exists. Choose another one from your projects list.
        </p>
      </SectionCard>
    );
  }

  const experimentRows = experiments.data ?? [];
  const deploymentRows = deployments.data ?? [];
  const projectApps = (apps.data ?? []).filter((app) => app.project_id === projectId);

  const stages = workflowStages({
    dataset: dataset.data ?? null,
    modelConfig: modelConfig.data ?? null,
    experiments: experimentRows,
    deployments: deploymentRows,
    apps: projectApps,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.description || "No description yet."}
        actions={<StatusPill status={project.status} />}
      />

      <SectionCard title="Workflow" description="Each step unlocks the next one.">
        <WorkflowStepper stages={stages} />
      </SectionCard>

      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "overview" ? (
        <OverviewTab
          project={project}
          datasetName={dataset.data?.name ?? null}
          rowCount={dataset.data?.row_count ?? 0}
          targetColumn={dataset.data?.target_column ?? null}
          algorithm={modelConfig.data?.algorithm ?? null}
          experiments={experimentRows}
          deploymentCount={deploymentRows.length}
          onTab={setTab}
        />
      ) : null}

      {activeTab === "dataset" ? (
        <DatasetSection project={project} dataset={dataset.data ?? null} />
      ) : null}

      {activeTab === "preprocessing" ? (
        <PreprocessingSection
          project={project}
          dataset={dataset.data ?? null}
          modelConfig={modelConfig.data ?? null}
          onGoToDataset={() => setTab("dataset")}
        />
      ) : null}

      {activeTab === "model" ? (
        <ModelSection project={project} modelConfig={modelConfig.data ?? null} />
      ) : null}

      {activeTab === "training" ? (
        <TrainingSection
          project={project}
          dataset={dataset.data ?? null}
          modelConfig={modelConfig.data ?? null}
          experiments={experimentRows}
          onGoToModel={() => setTab("model")}
          onGoToPerformance={() => setTab("performance")}
        />
      ) : null}

      {activeTab === "performance" ? (
        <PerformanceSection
          project={project}
          experiments={experimentRows}
          onGoToTraining={() => setTab("training")}
        />
      ) : null}

      {activeTab === "test" ? (
        <TestSection
          dataset={dataset.data ?? null}
          experiments={experimentRows}
          onGoToTraining={() => setTab("training")}
        />
      ) : null}

      {activeTab === "deploy" ? (
        <DeploySection
          project={project}
          dataset={dataset.data ?? null}
          experiments={experimentRows}
          deployments={deploymentRows}
          onGoToTraining={() => setTab("training")}
        />
      ) : null}

      {activeTab === "settings" ? (
        <ProjectSettingsTab projectId={projectId} project={project} />
      ) : null}
    </div>
  );
}

function OverviewTab({
  project,
  datasetName,
  rowCount,
  targetColumn,
  algorithm,
  experiments,
  deploymentCount,
  onTab,
}: {
  project: { problem_type: string; created_at: string; updated_at: string };
  datasetName: string | null;
  rowCount: number;
  targetColumn: string | null;
  algorithm: string | null;
  experiments: { id: string; metrics: unknown; problem_type: string }[];
  deploymentCount: number;
  onTab: (tab: string) => void;
}) {
  const best = experiments.length
    ? experiments.reduce((top, item) =>
        primaryMetric(item.problem_type, item.metrics as Metrics).value >
        primaryMetric(top.problem_type, top.metrics as Metrics).value
          ? item
          : top,
      )
    : null;
  const bestMetric = best ? primaryMetric(best.problem_type, best.metrics as Metrics) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Project summary">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Row
            label="Problem type"
            value={
              PROBLEM_TYPES.find((item) => item.value === project.problem_type)?.label ??
              project.problem_type
            }
          />
          <Row
            label="Dataset"
            value={
              datasetName ? `${datasetName} · ${rowCount.toLocaleString()} rows` : "Not uploaded"
            }
          />
          <Row label="Target column" value={targetColumn ?? "Not selected"} />
          <Row
            label="Model"
            value={algorithm ? (modelById(algorithm)?.name ?? algorithm) : "Not configured"}
          />
          <Row label="Runs" value={String(experiments.length)} />
          <Row label="Deployments" value={String(deploymentCount)} />
          <Row
            label={bestMetric ? `Best ${bestMetric.label}` : "Best result"}
            value={bestMetric ? formatMetric(bestMetric.value, bestMetric.percent) : "No runs yet"}
          />
          <Row label="Created" value={formatDateTime(project.created_at)} />
          <Row label="Last updated" value={formatDateTime(project.updated_at)} />
        </dl>
      </SectionCard>

      <SectionCard title="Next steps" description="Jump straight to the step you need.">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { tab: "dataset", label: "Upload or review dataset" },
            { tab: "preprocessing", label: "Adjust preprocessing" },
            { tab: "model", label: "Choose a model" },
            { tab: "training", label: "Train a model" },
            { tab: "performance", label: "Review performance" },
            { tab: "test", label: "Test predictions" },
            { tab: "deploy", label: "Deploy the model" },
            { tab: "settings", label: "Edit project details" },
          ].map((item) => (
            <Button
              key={item.tab}
              variant="outline"
              className="justify-start"
              onClick={() => onTab(item.tab)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}

function ProjectSettingsTab({
  projectId,
  project,
}: {
  projectId: string;
  project: { name: string; description: string | null; status: string; problem_type: string };
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (name.trim().length < 3) {
      toast.error("Project name needs at least 3 characters.");
      return;
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
    setSaving(false);
    if (error) {
      toast.error("We couldn't save these changes.");
      return;
    }
    if (auth.user) {
      await logActivity({
        userId: auth.user.id,
        projectId,
        projectName: name.trim(),
        action: "Project details updated",
      });
    }
    await queryClient.invalidateQueries();
    toast.success("Project updated.");
  };

  return (
    <SectionCard
      title="Project details"
      description="Rename the project, update its description or change its status."
      actions={
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      }
    >
      <div className="grid max-w-2xl gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Project name</Label>
          <Input id="project-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Problem type is fixed after creation so existing runs stay comparable. Current type:{" "}
          {PROBLEM_TYPES.find((item) => item.value === project.problem_type)?.label ??
            project.problem_type}
          .
        </p>
      </div>
    </SectionCard>
  );
}
