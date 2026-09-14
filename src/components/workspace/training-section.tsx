import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Play, Settings2 } from "lucide-react";

import { EmptyState, SectionCard, SimulationBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity, touchProject } from "@/lib/db";
import { TRAINING_STAGES, activeEngine, formatMetric, primaryMetric } from "@/lib/ml/engine";
import { modelById } from "@/lib/ml/models";
import { DEFAULT_PREPROCESSING } from "@/lib/types";
import type {
  ColumnProfile,
  DatasetRow,
  ExperimentRow,
  Metrics,
  ModelConfigRow,
  PreprocessingConfig,
  ProjectRow,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/workflow";

export function TrainingSection({
  project,
  dataset,
  modelConfig,
  experiments,
  onGoToModel,
  onGoToPerformance,
}: {
  project: ProjectRow;
  dataset: DatasetRow | null;
  modelConfig: ModelConfigRow | null;
  experiments: ExperimentRow[];
  onGoToModel: () => void;
  onGoToPerformance: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const model = modelById(modelConfig?.algorithm);
  const [runName, setRunName] = useState("");
  const [stage, setStage] = useState(-1);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ metrics: Metrics; durationMs: number } | null>(
    null,
  );

  const ready = Boolean(dataset?.target_column && modelConfig?.algorithm);

  if (!ready) {
    return (
      <SectionCard title="Training">
        <EmptyState
          icon={<Settings2 className="size-5" />}
          title="Configuration incomplete"
          description="Upload a dataset with a target column and save a model configuration before training."
          action={<Button onClick={onGoToModel}>Configure model</Button>}
        />
      </SectionCard>
    );
  }

  const preprocessing =
    (modelConfig!.preprocessing as PreprocessingConfig | undefined) ?? DEFAULT_PREPROCESSING;
  const columns = (dataset!.columns as ColumnProfile[] | undefined) ?? [];
  const features = preprocessing.features.length
    ? preprocessing.features
    : columns
        .filter((column) => column.name !== dataset!.target_column)
        .map((column) => column.name);

  const start = async () => {
    if (!user) return;
    setRunning(true);
    setStage(0);
    setLastResult(null);
    try {
      const result = await activeEngine.train(
        {
          algorithm: modelConfig!.algorithm,
          problemType: project.problem_type,
          datasetName: dataset!.name,
          rowCount: dataset!.row_count,
          targetColumn: dataset!.target_column,
          columns,
          features,
          hyperparameters: (modelConfig!.hyperparameters as Record<string, number | string>) ?? {},
          preprocessing,
          trainSplit: modelConfig!.train_split,
        },
        (value) => setStage(value),
      );

      const name =
        runName.trim() || `${model?.name ?? modelConfig!.algorithm} run ${experiments.length + 1}`;

      const { error } = await supabase.from("experiments").insert({
        user_id: user.id,
        project_id: project.id,
        name,
        algorithm: modelConfig!.algorithm,
        problem_type: project.problem_type,
        dataset_name: dataset!.name,
        target_column: dataset!.target_column,
        feature_names: features,
        hyperparameters: (modelConfig!.hyperparameters as Record<string, number | string>) ?? {},
        preprocessing,
        metrics: result.metrics,
        confusion_matrix: result.confusionMatrix,
        duration_ms: result.durationMs,
        engine: result.engine,
        status: "completed",
      });
      if (error) throw new Error("Training finished but the run couldn't be saved.");

      await touchProject(project.id, { status: "testing" });
      await logActivity({
        userId: user.id,
        projectId: project.id,
        projectName: project.name,
        action: `Training completed (${name})`,
      });
      await queryClient.invalidateQueries();
      setLastResult({ metrics: result.metrics, durationMs: result.durationMs });
      setRunName("");
      toast.success("Training completed — simulated results saved.");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Training could not be completed.");
      setStage(-1);
    } finally {
      setRunning(false);
    }
  };

  const progress = stage < 0 ? 0 : Math.round(((stage + 1) / TRAINING_STAGES.length) * 100);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Training"
        description="Runs the built-in simulation engine and saves the run as an experiment."
        actions={<SimulationBadge label="Simulated training" />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Summary
                label="Dataset"
                value={`${dataset!.name} · ${dataset!.row_count.toLocaleString()} rows`}
              />
              <Summary label="Target" value={dataset!.target_column ?? "—"} />
              <Summary label="Model" value={model?.name ?? modelConfig!.algorithm} />
              <Summary
                label="Train / test"
                value={`${modelConfig!.train_split}% / ${100 - modelConfig!.train_split}%`}
              />
              <Summary label="Input columns" value={String(features.length)} />
              <Summary label="Scaling" value={preprocessing.scaling} />
            </dl>

            <div className="max-w-sm space-y-1.5">
              <Label htmlFor="run-name">Run name (optional)</Label>
              <Input
                id="run-name"
                value={runName}
                onChange={(event) => setRunName(event.target.value)}
                placeholder={`${model?.name ?? "Model"} run ${experiments.length + 1}`}
              />
            </div>

            <Button onClick={start} disabled={running}>
              {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {running ? "Training…" : "Start Training"}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Progress
              </p>
              <span className="text-sm tabular-nums text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="mt-3" />
            <ol className="mt-4 space-y-2">
              {TRAINING_STAGES.map((label, index) => (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    index < stage && "text-success",
                    index === stage && "font-medium text-foreground",
                    index > stage && "text-muted-foreground",
                  )}
                >
                  {index < stage ? (
                    <Check className="size-4" />
                  ) : index === stage && running ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="size-4 rounded-full border border-border" />
                  )}
                  {label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SectionCard>

      {lastResult ? (
        <SectionCard
          title="Latest run"
          description={`Finished in ${formatDuration(lastResult.durationMs)}.`}
          actions={
            <Button variant="outline" onClick={onGoToPerformance}>
              View performance
            </Button>
          }
        >
          <p className="text-sm">
            {primaryMetric(project.problem_type, lastResult.metrics).label}:{" "}
            <span className="font-semibold tabular-nums">
              {formatMetric(
                primaryMetric(project.problem_type, lastResult.metrics).value,
                primaryMetric(project.problem_type, lastResult.metrics).percent,
              )}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            These numbers come from the deterministic simulation engine, not a trained model.
          </p>
        </SectionCard>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
