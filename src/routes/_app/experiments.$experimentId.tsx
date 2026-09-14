import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ConfusionMatrix } from "@/components/confusion-matrix";
import {
  LoadingRows,
  MetricTile,
  PageHeader,
  SectionCard,
  SimulationBadge,
  StatusPill,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { formatMetric } from "@/lib/ml/engine";
import { modelById } from "@/lib/ml/models";
import { useExperiment, useExperiments, useProject } from "@/lib/queries";
import type { Metrics } from "@/lib/types";
import { formatDateTime, formatDuration } from "@/lib/workflow";
import { modelInsights } from "@/lib/insights";

export const Route = createFileRoute("/_app/experiments/$experimentId")({
  head: () => ({
    meta: [
      { title: "Experiment results — ML Studio" },
      {
        name: "description",
        content: "Metrics, configuration and insights for a single training run.",
      },
      { property: "og:title", content: "Experiment results — ML Studio" },
      {
        property: "og:description",
        content: "Metrics, configuration and insights for a training run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperimentDetail,
});

function ExperimentDetail() {
  const { experimentId } = Route.useParams();
  const experimentQuery = useExperiment(experimentId);
  const experiment = experimentQuery.data;
  const project = useProject(experiment?.project_id ?? "");
  const siblings = useExperiments(experiment?.project_id ?? undefined);

  if (experimentQuery.isLoading) return <LoadingRows rows={4} />;

  if (!experiment) {
    return (
      <SectionCard title="Experiment not found">
        <p className="text-sm text-muted-foreground">
          This experiment no longer exists or belongs to another workspace.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/experiments">Back to experiments</Link>
        </Button>
      </SectionCard>
    );
  }

  const metrics = experiment.metrics as Metrics;
  const matrix = experiment.confusion_matrix as { labels: string[]; matrix: number[][] } | null;
  const insights = modelInsights(experiment, siblings.data ?? []);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/experiments">
          <ArrowLeft className="size-4" /> All experiments
        </Link>
      </Button>

      <PageHeader
        title={experiment.name}
        description={`${modelById(experiment.algorithm)?.name ?? experiment.algorithm} · ${
          project.data?.name ?? "Project"
        }`}
        actions={
          <>
            <StatusPill status={experiment.status} />
            {experiment.engine === "simulation" ? <SimulationBadge /> : null}
          </>
        }
      />

      <SectionCard title="Metrics" description="Results recorded when this experiment finished.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {experiment.problem_type === "regression" ? (
            <>
              <MetricTile label="R²" value={formatMetric(metrics.r2, false)} emphasis />
              <MetricTile label="MAE" value={formatMetric(metrics.mae, false)} />
              <MetricTile label="MSE" value={formatMetric(metrics.mse, false)} />
              <MetricTile label="RMSE" value={formatMetric(metrics.rmse, false)} />
            </>
          ) : experiment.problem_type === "clustering" ? (
            <>
              <MetricTile
                label="Silhouette"
                value={formatMetric(metrics.silhouette, false)}
                emphasis
              />
              <MetricTile label="Clusters" value={String(metrics.clusters ?? "—")} />
            </>
          ) : (
            <>
              <MetricTile label="Accuracy" value={formatMetric(metrics.accuracy)} emphasis />
              <MetricTile label="Precision" value={formatMetric(metrics.precision)} />
              <MetricTile label="Recall" value={formatMetric(metrics.recall)} />
              <MetricTile label="F1 Score" value={formatMetric(metrics.f1)} />
            </>
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Run details">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail
              label="Algorithm"
              value={modelById(experiment.algorithm)?.name ?? experiment.algorithm}
            />
            <Detail label="Dataset" value={experiment.dataset_name ?? "—"} />
            <Detail label="Target column" value={experiment.target_column ?? "—"} />
            <Detail label="Training duration" value={formatDuration(experiment.duration_ms)} />
            <Detail label="Training date" value={formatDateTime(experiment.created_at)} />
            <Detail
              label="Engine"
              value={experiment.engine === "simulation" ? "Simulation (demo)" : "Python service"}
            />
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hyperparameters
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md bg-surface p-3 font-mono text-xs">
              {JSON.stringify(experiment.hyperparameters, null, 2)}
            </pre>
          </div>
        </SectionCard>

        <SectionCard
          title="Model insights"
          description="Rule-based observations from the recorded metrics."
        >
          <ul className="space-y-3 text-sm">
            {insights.map((insight) => (
              <li key={insight} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {insight}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {matrix ? (
        <SectionCard
          title="Confusion matrix"
          description="Correct predictions sit on the diagonal."
        >
          <ConfusionMatrix labels={matrix.labels} matrix={matrix.matrix} />
        </SectionCard>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
