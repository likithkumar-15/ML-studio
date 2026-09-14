import { useState } from "react";

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
import { SimulationBadge } from "@/components/common";
import { modelById } from "@/lib/ml/models";
import { runPrediction, sampleInputs } from "@/lib/predict";
import type { AppField, DatasetRow, ExperimentRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PredictionOutcome = {
  prediction: string | number;
  confidence: number;
  responseTimeMs: number;
  simulated: boolean;
};

export function PredictionForm({
  fields,
  experiment,
  dataset,
  submitLabel = "Run Prediction",
  showJson = true,
  className,
  onResult,
}: {
  fields: AppField[];
  experiment: ExperimentRow | null;
  dataset: DatasetRow | null;
  submitLabel?: string;
  showJson?: boolean;
  className?: string;
  onResult?: (outcome: PredictionOutcome) => void;
}) {
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    sampleInputs(fields, dataset),
  );
  const [result, setResult] = useState<PredictionOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!experiment) {
      setError("Train a model first — there is no experiment to predict with yet.");
      return;
    }
    const missing = fields.filter((field) => {
      const value = values[field.name];
      return value === "" || value === undefined || value === null;
    });
    if (missing.length) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}.`);
      return;
    }
    setError("");
    setRunning(true);
    try {
      const outcome = await runPrediction({ experiment, dataset, inputs: values });
      const next = {
        prediction: outcome.prediction,
        confidence: outcome.confidence,
        responseTimeMs: outcome.responseTimeMs,
        simulated: outcome.engine === "simulation",
      };
      setResult(next);
      onResult?.(next);
    } finally {
      setRunning(false);
    }
  };

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Upload a dataset and pick a target column so input fields can be generated.
      </p>
    );
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", className)}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`field-${field.name}`}>{field.label}</Label>
              {field.type === "categorical" && field.options?.length ? (
                <Select
                  value={String(values[field.name] ?? "")}
                  onValueChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
                >
                  <SelectTrigger id={`field-${field.name}`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`field-${field.name}`}
                  type={field.type === "numeric" ? "number" : "text"}
                  value={String(values[field.name] ?? "")}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: field.type === "numeric" ? e.target.value : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Button type="submit" disabled={running}>
          {running ? "Predicting…" : submitLabel}
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-5">
        {result ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Prediction
              </p>
              {result.simulated ? <SimulationBadge label="Simulated prediction" /> : null}
            </div>
            <p className="text-3xl font-semibold tracking-tight">{String(result.prediction)}</p>
            <dl className="grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Confidence</dt>
                <dd className="font-medium tabular-nums">
                  {(result.confidence * 100).toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Model</dt>
                <dd className="font-medium">
                  {modelById(experiment?.algorithm)?.name ?? experiment?.algorithm ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Response time</dt>
                <dd className="font-medium tabular-nums">{result.responseTimeMs} ms</dd>
              </div>
            </dl>
            {showJson ? (
              <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-xs">
                {JSON.stringify(
                  {
                    prediction: result.prediction,
                    confidence: result.confidence,
                    model: experiment?.algorithm ?? null,
                    simulated: result.simulated,
                  },
                  null,
                  2,
                )}
              </pre>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full flex-col justify-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No prediction yet</p>
            <p className="mt-1">Fill in the fields and run a prediction to see the result here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
