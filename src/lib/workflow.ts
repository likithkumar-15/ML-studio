import type { WorkflowStage } from "@/components/workflow-stepper";
import type {
  DatasetRow,
  DeploymentRow,
  ExperimentRow,
  GeneratedAppRow,
  ModelConfigRow,
} from "./types";

export type WorkflowInput = {
  dataset: DatasetRow | null;
  modelConfig: ModelConfigRow | null;
  experiments: ExperimentRow[];
  deployments: DeploymentRow[];
  apps?: GeneratedAppRow[];
};

const STAGE_LABELS = [
  "Dataset",
  "Preprocessing",
  "Model",
  "Training",
  "Evaluation",
  "Testing",
  "Deployment",
  "Application",
];

export function workflowStages(input: WorkflowInput): WorkflowStage[] {
  const hasDataset = Boolean(input.dataset);
  const hasTarget = Boolean(input.dataset?.target_column);
  const hasPreprocessing = Boolean(
    input.modelConfig &&
    (input.modelConfig.preprocessing as { features?: string[] })?.features?.length,
  );
  const hasModel = Boolean(input.modelConfig?.algorithm);
  const hasExperiment = input.experiments.length > 0;
  const hasDeployment = input.deployments.some((d) => d.status === "active");
  const hasApp = Boolean(input.apps?.length);

  const done = [
    hasDataset && hasTarget,
    hasPreprocessing,
    hasModel,
    hasExperiment,
    hasExperiment,
    hasExperiment,
    hasDeployment,
    hasApp,
  ];

  const firstTodo = done.findIndex((value) => !value);

  return STAGE_LABELS.map((label, index) => ({
    key: label,
    label,
    state: done[index] ? "done" : index === firstTodo ? "current" : "todo",
  }));
}

export function formatDuration(ms: number) {
  if (!ms) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
