import { activeEngine } from "./ml/engine";
import type { AppField, ColumnProfile, DatasetRow, ExperimentRow } from "./types";

export function fieldsFromExperiment(
  experiment: ExperimentRow | null,
  dataset: DatasetRow | null,
): AppField[] {
  const columns = (dataset?.columns as ColumnProfile[] | undefined) ?? [];
  const names = (experiment?.feature_names as string[] | undefined)?.length
    ? (experiment!.feature_names as string[])
    : columns.filter((c) => c.name !== dataset?.target_column).map((c) => c.name);

  return names.slice(0, 10).map((name) => {
    const column = columns.find((c) => c.name === name);
    const field: AppField = {
      name,
      label: name.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      type: column?.type === "categorical" ? "categorical" : "numeric",
    };
    if (column?.type === "categorical") field.options = column.sampleValues.slice(0, 6);
    return field;
  });
}

export function targetLabelsFor(
  experiment: ExperimentRow | null,
  dataset: DatasetRow | null,
): string[] {
  const matrix = experiment?.confusion_matrix as { labels: string[] } | null | undefined;
  if (matrix?.labels?.length) return matrix.labels;
  const columns = (dataset?.columns as ColumnProfile[] | undefined) ?? [];
  const target = columns.find((c) => c.name === dataset?.target_column);
  if (target?.sampleValues.length) return target.sampleValues.slice(0, 5);
  return ["class_0", "class_1"];
}

export function sampleInputs(fields: AppField[], dataset: DatasetRow | null) {
  const previewRow = ((dataset?.preview_rows as Record<string, string>[] | undefined) ?? [])[0];
  const inputs: Record<string, string | number> = {};
  fields.forEach((field) => {
    const raw = previewRow?.[field.name];
    if (field.type === "numeric") {
      inputs[field.name] = raw && Number.isFinite(Number(raw)) ? Number(raw) : 0;
    } else {
      inputs[field.name] = raw ?? field.options?.[0] ?? "";
    }
  });
  return inputs;
}

export async function runPrediction(input: {
  experiment: ExperimentRow;
  dataset: DatasetRow | null;
  inputs: Record<string, string | number>;
}) {
  const started = performance.now();
  const result = await activeEngine.predict({
    algorithm: input.experiment.algorithm,
    problemType: input.experiment.problem_type,
    targetColumn: input.experiment.target_column,
    targetLabels: targetLabelsFor(input.experiment, input.dataset),
    inputs: input.inputs,
  });
  return { ...result, responseTimeMs: Math.round(performance.now() - started) };
}
