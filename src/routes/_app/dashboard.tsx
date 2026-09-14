import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, FlaskConical, FolderKanban, Plus, Rocket, Sparkles, Upload } from "lucide-react";

import {
  EmptyState,
  LoadingRows,
  PageHeader,
  SectionCard,
  StatCard,
  StatusPill,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { useAuth } from "@/lib/auth";
import { createDemoProject } from "@/lib/demo";
import { formatMetric, primaryMetric } from "@/lib/ml/engine";
import { modelById } from "@/lib/ml/models";
import { useActivity, useDeployments, useExperiments, useProjects } from "@/lib/queries";
import { formatDateTime } from "@/lib/workflow";
import type { Metrics } from "@/lib/types";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ML Studio" },
      {
        name: "description",
        content: "Your machine learning projects, experiments and deployments at a glance.",
      },
      { property: "og:title", content: "Dashboard — ML Studio" },
      { property: "og:description", content: "Projects, experiments and deployments at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projects = useProjects();
  const experiments = useExperiments();
  const deployments = useDeployments();
  const activity = useActivity(6);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const activeDeployments = (deployments.data ?? []).filter((d) => d.status === "active");
  const trainedModels = new Set((experiments.data ?? []).map((e) => e.algorithm)).size;

  const seedDemo = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      const project = await createDemoProject(user.id);
      await queryClient.invalidateQueries();
      toast.success("Demo project added with sample values.");
      navigate({
        to: "/projects/$projectId",
        params: { projectId: project.id },
        search: { tab: "overview" },
      });
    } catch {
      toast.error("We couldn't create the demo project. Please try again.");
    } finally {
      setSeeding(false);
    }
  };

  const loading = projects.isLoading || experiments.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Everything happening across your machine learning workspace."
        actions={
          <>
            <Button variant="outline" onClick={seedDemo} disabled={seeding}>
              <Sparkles className="size-4" />
              {seeding ? "Adding…" : "Add demo project"}
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              New Project
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={projects.data?.length ?? 0}
          icon={<FolderKanban className="size-4" />}
        />
        <StatCard
          label="Experiments Run"
          value={experiments.data?.length ?? 0}
          icon={<FlaskConical className="size-4" />}
        />
        <StatCard
          label="Models Trained"
          value={trainedModels}
          hint="Distinct algorithms"
          icon={<Activity className="size-4" />}
        />
        <StatCard
          label="Active Deployments"
          value={activeDeployments.length}
          icon={<Rocket className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Recent Projects"
          className="lg:col-span-2"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">View all</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {loading ? (
            <div className="p-5">
              <LoadingRows />
            </div>
          ) : (projects.data ?? []).length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FolderKanban className="size-5" />}
                title="No projects yet"
                description="You haven't created a machine learning project yet."
                action={<Button onClick={() => setDialogOpen(true)}>Create Project</Button>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(projects.data ?? []).slice(0, 5).map((project) => (
                <li key={project.id}>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    search={{ tab: "overview" }}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{project.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {project.problem_type.replace(/_/g, " ")} · updated{" "}
                        {formatDateTime(project.updated_at)}
                      </p>
                    </div>
                    <StatusPill status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Quick Actions">
          <div className="space-y-2">
            <Button className="w-full justify-start" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" /> New Project
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/projects">
                <Upload className="size-4" /> Upload Dataset
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/experiments">
                <FlaskConical className="size-4" /> Start Experiment
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Datasets and experiments live inside a project workspace — pick a project to continue.
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Recent Experiments"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/experiments">View all</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {(experiments.data ?? []).length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<FlaskConical className="size-5" />}
                title="No experiments yet"
                description="Train your first model to create an experiment."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(experiments.data ?? []).slice(0, 5).map((experiment) => {
                const metric = primaryMetric(
                  experiment.problem_type,
                  experiment.metrics as Metrics,
                );
                return (
                  <li key={experiment.id}>
                    <Link
                      to="/experiments/$experimentId"
                      params={{ experimentId: experiment.id }}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{experiment.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {modelById(experiment.algorithm)?.name ?? experiment.algorithm} ·{" "}
                          {formatDateTime(experiment.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatMetric(metric.value, metric.percent)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/activity">View all</Link>
            </Button>
          }
          bodyClassName="p-0"
        >
          {(activity.data ?? []).length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Activity className="size-5" />}
                title="Nothing here yet"
                description="Your project activity will appear here as you work."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {(activity.data ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.project_name ?? "Workspace"} · {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
