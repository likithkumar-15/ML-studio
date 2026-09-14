import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FlaskConical } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  EmptyState,
  LoadingRows,
  PageHeader,
  SectionCard,
  SimulationBadge,
  StatusPill,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMetric, primaryMetric } from "@/lib/ml/engine";
import { modelById } from "@/lib/ml/models";
import { useExperiments, useProjects } from "@/lib/queries";
import type { ExperimentRow, Metrics } from "@/lib/types";
import { formatDateTime, formatDuration } from "@/lib/workflow";

export const Route = createFileRoute("/_app/experiments/")({
  head: () => ({
    meta: [
      { title: "Experiments — ML Studio" },
      {
        name: "description",
        content: "Track, filter and compare every training run in your workspace.",
      },
      { property: "og:title", content: "Experiments — ML Studio" },
      { property: "og:description", content: "Track, filter and compare every training run." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperimentsPage,
});

function ExperimentsPage() {
  const experiments = useExperiments();
  const projects = useProjects();
  const [projectFilter, setProjectFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  const all = experiments.data ?? [];
  const rows = all.filter((experiment) => {
    const matchesProject = projectFilter === "all" || experiment.project_id === projectFilter;
    const matchesModel = modelFilter === "all" || experiment.algorithm === modelFilter;
    return matchesProject && matchesModel;
  });

  const algorithms = Array.from(new Set(all.map((e) => e.algorithm)));
  const projectName = (id: string) => projects.data?.find((p) => p.id === id)?.name ?? "—";
  const comparison = all.filter((e) => selected.includes(e.id));

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Experiments"
        description="Every training run with its configuration, metrics and duration."
        actions={
          selected.length > 0 ? (
            <Button variant="outline" onClick={() => setSelected([])}>
              Clear selection ({selected.length})
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="sm:w-64">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {(projects.data ?? []).map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={modelFilter} onValueChange={setModelFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All models</SelectItem>
            {algorithms.map((algorithm) => (
              <SelectItem key={algorithm} value={algorithm}>
                {modelById(algorithm)?.name ?? algorithm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SectionCard bodyClassName="p-0">
        {experiments.isLoading ? (
          <div className="p-5">
            <LoadingRows rows={4} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<FlaskConical className="size-5" />}
              title="No experiments yet"
              description="Train your first model to create an experiment."
              action={
                <Button asChild>
                  <Link to="/projects">Go to projects</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-5 py-3" />
                  <th className="px-5 py-3 font-medium">Experiment</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Model</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((experiment) => {
                  const metric = primaryMetric(
                    experiment.problem_type,
                    experiment.metrics as Metrics,
                  );
                  return (
                    <tr key={experiment.id} className="transition-colors hover:bg-surface">
                      <td className="px-5 py-3">
                        <Checkbox
                          checked={selected.includes(experiment.id)}
                          onCheckedChange={() => toggle(experiment.id)}
                          aria-label={`Compare ${experiment.name}`}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          to="/experiments/$experimentId"
                          params={{ experimentId: experiment.id }}
                          className="font-medium hover:text-primary"
                        >
                          {experiment.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {projectName(experiment.project_id)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {modelById(experiment.algorithm)?.name ?? experiment.algorithm}
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {formatMetric(metric.value, metric.percent)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDateTime(experiment.created_at)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {formatDuration(experiment.duration_ms)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={experiment.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {comparison.length >= 2 ? <ComparisonPanel experiments={comparison} /> : null}
      {comparison.length === 1 ? (
        <p className="text-sm text-muted-foreground">
          Select one more experiment to see a side-by-side comparison.
        </p>
      ) : null}
    </div>
  );
}

function ComparisonPanel({ experiments }: { experiments: ExperimentRow[] }) {
  const scored = experiments.map((experiment) => {
    const metrics = experiment.metrics as Metrics;
    const metric = primaryMetric(experiment.problem_type, metrics);
    return {
      experiment,
      metrics,
      score: metric.value,
      label: metric.label,
      percent: metric.percent,
    };
  });
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));

  const chartData = scored.map((item) => ({
    name: modelById(item.experiment.algorithm)?.name ?? item.experiment.algorithm,
    score: Number((item.score * 100).toFixed(1)),
  }));

  return (
    <SectionCard
      title="Experiment comparison"
      description={`Strongest run: ${modelById(best.experiment.algorithm)?.name ?? best.experiment.algorithm}`}
      actions={<SimulationBadge label="Simulation mode" />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Model</th>
              <th className="py-2 pr-4 font-medium">Primary score</th>
              <th className="py-2 pr-4 font-medium">Precision</th>
              <th className="py-2 pr-4 font-medium">Recall</th>
              <th className="py-2 pr-4 font-medium">F1</th>
              <th className="py-2 pr-4 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {scored.map((item) => (
              <tr
                key={item.experiment.id}
                className={item.experiment.id === best.experiment.id ? "bg-success/8" : undefined}
              >
                <td className="py-2.5 pr-4 font-medium">
                  {modelById(item.experiment.algorithm)?.name ?? item.experiment.algorithm}
                  {item.experiment.id === best.experiment.id ? (
                    <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                      Best
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 pr-4 tabular-nums">
                  {item.label} {formatMetric(item.score, item.percent)}
                </td>
                <td className="py-2.5 pr-4 tabular-nums">{formatMetric(item.metrics.precision)}</td>
                <td className="py-2.5 pr-4 tabular-nums">{formatMetric(item.metrics.recall)}</td>
                <td className="py-2.5 pr-4 tabular-nums">{formatMetric(item.metrics.f1)}</td>
                <td className="py-2.5 pr-4 tabular-nums">
                  {formatDuration(item.experiment.duration_ms)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
            <ChartTooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
              }}
            />
            <Bar dataKey="score" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Primary score" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
