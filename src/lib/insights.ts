import { modelById } from "./ml/models";
import { primaryMetric } from "./ml/engine";
import type { ExperimentRow, Metrics } from "./types";

/**
 * Rule-based observations derived from stored metrics. These are simple
 * comparisons, not AI-generated commentary.
 */
export function modelInsights(experiment: ExperimentRow, siblings: ExperimentRow[]): string[] {
  const metrics = experiment.metrics as Metrics;
  const insights: string[] = [];
  const { value, label, percent } = primaryMetric(experiment.problem_type, metrics);

  const others = siblings.filter((s) => s.id !== experiment.id);
  const bestOther = others.reduce<number>((best, item) => {
    const score = primaryMetric(item.problem_type, item.metrics as Metrics).value;
    return Math.max(best, score);
  }, 0);

  if (others.length === 0) {
    insights.push(
      "This is the only experiment in the project, so there is nothing to compare it against yet.",
    );
  } else if (value >= bestOther) {
    insights.push(`This experiment achieved the highest ${label.toLowerCase()} in this project.`);
  } else {
    insights.push(
      `Another experiment in this project scored higher on ${label.toLowerCase()} (${
        percent ? `${(bestOther * 100).toFixed(1)}%` : bestOther.toFixed(3)
      }).`,
    );
  }

  if (experiment.problem_type === "classification" || experiment.problem_type === "nlp") {
    const precision = metrics.precision ?? 0;
    const recall = metrics.recall ?? 0;
    if (Math.abs(precision - recall) < 0.01) {
      insights.push(
        "Precision and recall are balanced, so the model treats both error types similarly.",
      );
    } else if (recall < precision) {
      insights.push("Recall is lower than precision — the model misses some positive cases.");
    } else {
      insights.push("Precision is lower than recall — the model raises some false positives.");
    }

    if ((metrics.accuracy ?? 0) > 0.97) {
      insights.push("Accuracy is very high; check for leakage between the target and a feature.");
    }
    if (experiment.algorithm !== "random_forest") {
      insights.push(
        "Consider comparing this model with Random Forest as a strong tabular baseline.",
      );
    }
  }

  if (experiment.problem_type === "regression") {
    if ((metrics.r2 ?? 0) < 0.6) {
      insights.push(
        "R² is modest — more features or a tree-based model may capture the pattern better.",
      );
    }
    insights.push(
      "RMSE punishes large errors more than MAE, so compare both before choosing a model.",
    );
  }

  if (experiment.problem_type === "clustering") {
    insights.push(
      (metrics.silhouette ?? 0) > 0.5
        ? "The silhouette score suggests reasonably well-separated clusters."
        : "A low silhouette score suggests trying a different number of clusters.",
    );
  }

  if (experiment.engine === "simulation") {
    insights.push(
      `These are demo values from the built-in simulation engine for ${
        modelById(experiment.algorithm)?.name ?? experiment.algorithm
      }, not a fitted model.`,
    );
  }

  return insights;
}
