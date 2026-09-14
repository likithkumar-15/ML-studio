/**
 * ML engine boundary.
 *
 * The platform talks to an `MlEngine` implementation only. Today that is the
 * built-in `simulationEngine`, which produces deterministic, clearly-labelled
 * DEMO results — it does not fit a real model. To plug in a genuine Python /
 * FastAPI service later, implement `MlEngine` against those HTTP endpoints and
 * export it as `activeEngine`; no UI code needs to change.
 */
import type { ColumnProfile, Metrics, PreprocessingConfig } from "../types";

export type TrainRequest = {
  algorithm: string;
  problemType: string;
  datasetName: string;
  rowCount: number;
  targetColumn: string | null;
  columns: ColumnProfile[];
  features: string[];
  hyperparameters: Record<string, number | string>;
  preprocessing: PreprocessingConfig;
  trainSplit: number;
};

export type TrainResult = {
  metrics: Metrics;
  confusionMatrix: { labels: string[]; matrix: number[][] } | null;
  durationMs: number;
  engine: "simulation" | "python";
};

export type PredictRequest = {
  algorithm: string;
  problemType: string;
  targetColumn: string | null;
  targetLabels: string[];
  inputs: Record<string, string | number>;
};

export type PredictResult = {
  prediction: string | number;
  confidence: number;
  engine: "simulation" | "python";
};

export type MlEngine = {
  id: string;
  simulated: boolean;
  train: (req: TrainRequest, onStage?: (stage: number) => void) => Promise<TrainResult>;
  predict: (req: PredictRequest) => Promise<PredictResult>;
};

export const TRAINING_STAGES = [
  "Preparing dataset",
  "Preprocessing",
  "Training model",
  "Evaluating",
  "Completed",
];

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic pseudo-random in [0,1) derived from a string seed. */
function seeded(seed: string) {
  return (hash(seed) % 100000) / 100000;
}

const BASE_QUALITY: Record<string, number> = {
  logistic_regression: 0.86,
  decision_tree: 0.855,
  random_forest: 0.918,
  svm: 0.884,
  knn: 0.861,
  linear_regression: 0.79,
  decision_tree_regressor: 0.82,
  random_forest_regressor: 0.89,
  kmeans: 0.55,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 4) {
  return Number(value.toFixed(digits));
}

function buildConfusionMatrix(labels: string[], rows: number, accuracy: number, seed: string) {
  const perLabel = Math.max(4, Math.floor((rows * 0.2) / labels.length));
  return {
    labels,
    matrix: labels.map((label, i) =>
      labels.map((_, j) => {
        if (i === j) return Math.round(perLabel * accuracy);
        const noise = seeded(`${seed}-${i}-${j}`);
        return Math.max(
          0,
          Math.round((perLabel * (1 - accuracy) * noise * 2) / (labels.length - 1 || 1)),
        );
      }),
    ),
  };
}

function targetLabels(req: TrainRequest): string[] {
  const target = req.columns.find((c) => c.name === req.targetColumn);
  if (target && target.type === "categorical" && target.sampleValues.length) {
    return target.sampleValues.slice(0, 5);
  }
  return ["class_0", "class_1"];
}

export const simulationEngine: MlEngine = {
  id: "simulation",
  simulated: true,

  async train(req, onStage) {
    const seed = [
      req.algorithm,
      req.datasetName,
      req.rowCount,
      req.targetColumn ?? "none",
      req.trainSplit,
      JSON.stringify(req.hyperparameters),
      JSON.stringify(req.preprocessing),
    ].join("|");

    for (let stage = 0; stage < TRAINING_STAGES.length; stage += 1) {
      onStage?.(stage);
      await new Promise((resolve) =>
        setTimeout(resolve, stage === TRAINING_STAGES.length - 1 ? 200 : 620),
      );
    }

    const base = BASE_QUALITY[req.algorithm] ?? 0.84;
    const dataBonus = clamp(Math.log10(Math.max(req.rowCount, 10)) / 40, 0, 0.04);
    const scalingBonus = req.preprocessing.scaling === "none" ? -0.015 : 0.01;
    const jitter = (seeded(seed) - 0.5) * 0.05;
    const durationMs = 1400 + Math.round(seeded(`${seed}-dur`) * 4200 + req.rowCount * 0.6);

    if (req.problemType === "regression") {
      const r2 = clamp(base + dataBonus + scalingBonus + jitter, 0.4, 0.98);
      const mae = round(clamp((1 - r2) * 42 + seeded(`${seed}-mae`) * 4, 0.4, 60), 3);
      const rmse = round(mae * (1.18 + seeded(`${seed}-rmse`) * 0.3), 3);
      return {
        metrics: { r2: round(r2), mae, mse: round(rmse * rmse, 3), rmse },
        confusionMatrix: null,
        durationMs,
        engine: "simulation",
      };
    }

    if (req.problemType === "clustering") {
      const clusters = Number(req.hyperparameters["n_clusters"] ?? 3);
      return {
        metrics: {
          silhouette: round(clamp(0.42 + jitter + dataBonus * 2, 0.1, 0.86)),
          clusters,
        },
        confusionMatrix: null,
        durationMs,
        engine: "simulation",
      };
    }

    const accuracy = clamp(base + dataBonus + scalingBonus + jitter, 0.55, 0.985);
    const precision = clamp(accuracy - 0.006 + (seeded(`${seed}-p`) - 0.5) * 0.02, 0.5, 0.99);
    const recall = clamp(accuracy - 0.017 + (seeded(`${seed}-r`) - 0.5) * 0.02, 0.5, 0.99);
    const f1 = (2 * precision * recall) / (precision + recall);

    return {
      metrics: {
        accuracy: round(accuracy),
        precision: round(precision),
        recall: round(recall),
        f1: round(f1),
      },
      confusionMatrix: buildConfusionMatrix(targetLabels(req), req.rowCount, accuracy, seed),
      durationMs,
      engine: "simulation",
    };
  },

  async predict(req) {
    const seed = JSON.stringify(req.inputs) + req.algorithm + (req.targetColumn ?? "");
    await new Promise((resolve) => setTimeout(resolve, 220 + Math.round(seeded(seed) * 260)));

    if (req.problemType === "regression") {
      const numericInputs = Object.values(req.inputs)
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n));
      const avg = numericInputs.length
        ? numericInputs.reduce((a, b) => a + b, 0) / numericInputs.length
        : 100;
      return {
        prediction: round(avg * (0.85 + seeded(seed) * 0.4), 2),
        confidence: round(0.72 + seeded(`${seed}-c`) * 0.24, 3),
        engine: "simulation",
      };
    }

    const labels = req.targetLabels.length ? req.targetLabels : ["class_0", "class_1"];
    const index = hash(seed) % labels.length;
    return {
      prediction: labels[index]!,
      confidence: round(0.68 + seeded(`${seed}-conf`) * 0.3, 3),
      engine: "simulation",
    };
  },
};

export const activeEngine: MlEngine = simulationEngine;

export function primaryMetric(problemType: string, metrics: Metrics) {
  if (problemType === "regression") return { label: "R²", value: metrics.r2 ?? 0, percent: false };
  if (problemType === "clustering")
    return { label: "Silhouette", value: metrics.silhouette ?? 0, percent: false };
  return { label: "Accuracy", value: metrics.accuracy ?? 0, percent: true };
}

export function formatMetric(value: number | undefined, percent = true) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return percent ? `${(value * 100).toFixed(1)}%` : value.toFixed(3);
}
