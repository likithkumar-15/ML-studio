import { useMemo, useState } from "react";
import { FlaskConical } from "lucide-react";

import { EmptyState, SectionCard, SimulationBadge } from "@/components/common";
import { PredictionForm } from "@/components/prediction-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldsFromExperiment } from "@/lib/predict";
import { modelById } from "@/lib/ml/models";
import type { DatasetRow, ExperimentRow } from "@/lib/types";

export function TestSection({
  dataset,
  experiments,
  onGoToTraining,
}: {
  dataset: DatasetRow | null;
  experiments: ExperimentRow[];
  onGoToTraining: () => void;
}) {
  const [experimentId, setExperimentId] = useState(experiments[0]?.id ?? "");
  const experiment = experiments.find((item) => item.id === experimentId) ?? experiments[0] ?? null;
  const fields = useMemo(() => fieldsFromExperiment(experiment, dataset), [experiment, dataset]);

  if (experiments.length === 0) {
    return (
      <SectionCard title="Test the model">
        <EmptyState
          icon={<FlaskConical className="size-5" />}
          title="Nothing to test yet"
          description="Train a model first, then send it sample inputs from here."
          action={<Button onClick={onGoToTraining}>Go to training</Button>}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Test the model"
      description="Fields are generated from the columns this run was trained on."
      actions={<SimulationBadge label="Simulated prediction" />}
    >
      <div className="mb-6 max-w-sm space-y-1.5">
        <Label>Trained run</Label>
        <Select value={experiment?.id ?? ""} onValueChange={setExperimentId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a run" />
          </SelectTrigger>
          <SelectContent>
            {experiments.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} · {modelById(item.algorithm)?.name ?? item.algorithm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PredictionForm fields={fields} experiment={experiment} dataset={dataset} />
    </SectionCard>
  );
}
