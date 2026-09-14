import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ConfusionMatrix } from "@/components/confusion-matrix";
import { EmptyState, MetricTile, SectionCard, SimulationBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { formatMetric, primaryMetric } from "@/lib/ml/engine";
import { modelById } from "@/lib/ml/models";
import { modelInsights } from "@/lib/insights";
import type { ExperimentRow, Metrics, ProjectRow } from "@/lib/types";
import { formatDateTime, formatDuration } from "@/lib/workflow";

export function PerformanceSection({
  project,
  experiments,
  onGoToTraining,
}: {
  project: ProjectRow;
  experiments: ExperimentRow[];
  onGoToTraining: () => void;
}) {
  if (experiments.length === 0) {
    return (
      <SectionCard title="Performance">
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="No results yet"
          description="Train a model to see accuracy, error metrics and a confusion matrix."
          action={<Button onClick={onGoToTraining}>Go to training</Button>}
        />
      </SectionCard>
    );
  }

  const best = experiments.reduce((top, item) =>
    primaryMetric(item.problem_type, item.metrics as Metrics).value >
    primaryMetric(top.problem_type, top.metrics as Metrics).value
      ? item
      : top,
  );
  const metrics = best.metrics as Metrics;
  const matrix = best.confusion_matrix as { labels: string[]; matrix: number[][] } | null;

  const chartData = experiments
    .slice()
    .reverse()
    .map((experiment) => ({
      name: experiment.name.length > 18 ? `${experiment.name.slice(0, 18)}…` : experiment.name,
      score: Number(
        (primaryMetric(experiment.problem_type, experiment.metrics as Metrics).value * 100).toFixed(
          1,
        ),
      ),
    }));
  const lowestScore = Math.min(...chartData.map((item) => item.score));
  const chartMinimum = Math.max(0, Math.floor(lowestScore / 5) * 5 - 5);

  const tiles: { label: string; value: string }[] =
    project.problem_type === "regression"
      ? [
          { label: "R²", value: formatMetric(metrics.r2, false) },
          { label: "MAE", value: formatMetric(metrics.mae, false) },
          { label: "MSE", value: formatMetric(metrics.mse, false) },
          { label: "RMSE", value: formatMetric(metrics.rmse, false) },
        ]
      : project.problem_type === "clustering"
        ? [
            { label: "Silhouette", value: formatMetric(metrics.silhouette, false) },
            { label: "Clusters", value: String(metrics.clusters ?? "—") },
          ]
        : [
            { label: "Accuracy", value: formatMetric(metrics.accuracy) },
            { label: "Precision", value: formatMetric(metrics.precision) },
            { label: "Recall", value: formatMetric(metrics.recall) },
            { label: "F1 score", value: formatMetric(metrics.f1) },
          ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Best run in this project"
        description={`${best.name} · ${modelById(best.algorithm)?.name ?? best.algorithm} · ${formatDateTime(best.created_at)} · trained in ${formatDuration(best.duration_ms)}`}
        actions={
          <div className="flex gap-2">
            <SimulationBadge label="Simulated metrics" />
            <Button asChild variant="outline" size="sm">
              <Link to="/experiments/$experimentId" params={{ experimentId: best.id }}>
                Open run
              </Link>
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile, index) => (
            <MetricTile
              key={tile.label}
              label={tile.label}
              value={tile.value}
              emphasis={index === 0}
            />
          ))}
        </div>
      </SectionCard>

      {matrix ? (
        <SectionCard
          title="Confusion matrix"
          description="Correct predictions sit on the diagonal."
        >
          <ConfusionMatrix labels={matrix.labels} matrix={matrix.matrix} />
        </SectionCard>
      ) : null}

      {experiments.length > 1 ? (
        <SectionCard
          title="Runs compared"
          description={`${primaryMetric(project.problem_type, metrics).label} across every run in this project.`}
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 22, right: 18, left: 0, bottom: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-muted-foreground)"
                  tickMargin={10}
                  padding={{ left: 36, right: 36 }}
                />
                <YAxis
                  domain={[chartMinimum, 100]}
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-muted-foreground)"
                  tickFormatter={(value: number) => `${value}%`}
                  width={48}
                />
                <ChartTooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "var(--color-card)", strokeWidth: 3 }}
                  activeDot={{ r: 7 }}
                >
                  <LabelList
                    dataKey="score"
                    position="top"
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    className="fill-foreground text-xs font-semibold"
                  />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Observations" description="Simple rule-based notes, not AI commentary.">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {modelInsights(best, experiments).map((insight) => (
            <li key={insight} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {insight}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
