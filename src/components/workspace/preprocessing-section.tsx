import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database } from "lucide-react";

import { EmptyState, HelpHint, SectionCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { modelsFor } from "@/lib/ml/models";
import { DEFAULT_PREPROCESSING } from "@/lib/types";
import type {
  ColumnProfile,
  DatasetRow,
  ModelConfigRow,
  PreprocessingConfig,
  ProjectRow,
} from "@/lib/types";

export function PreprocessingSection({
  project,
  dataset,
  modelConfig,
  onGoToDataset,
}: {
  project: ProjectRow;
  dataset: DatasetRow | null;
  modelConfig: ModelConfigRow | null;
  onGoToDataset: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const columns = (dataset?.columns as ColumnProfile[] | undefined) ?? [];
  const featureColumns = columns.filter((column) => column.name !== dataset?.target_column);

  const stored = (modelConfig?.preprocessing as PreprocessingConfig | undefined) ?? null;
  const [config, setConfig] = useState<PreprocessingConfig>(
    stored ?? { ...DEFAULT_PREPROCESSING, features: featureColumns.map((c) => c.name) },
  );
  const [split, setSplit] = useState(modelConfig?.train_split ?? 80);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stored && featureColumns.length && config.features.length === 0) {
      setConfig((prev) => ({ ...prev, features: featureColumns.map((c) => c.name) }));
    }
  }, [featureColumns, stored, config.features.length]);

  if (!dataset || !dataset.target_column) {
    return (
      <SectionCard title="Preprocessing">
        <EmptyState
          icon={<Database className="size-5" />}
          title="Upload a dataset first"
          description="Preprocessing options are generated from your dataset columns and target."
          action={<Button onClick={onGoToDataset}>Go to dataset</Button>}
        />
      </SectionCard>
    );
  }

  const toggleFeature = (name: string) => {
    setConfig((prev) => ({
      ...prev,
      features: prev.features.includes(name)
        ? prev.features.filter((feature) => feature !== name)
        : [...prev.features, name],
    }));
  };

  const save = async () => {
    if (!user) return;
    if (config.features.length === 0) {
      toast.error("Select at least one input column.");
      return;
    }
    setSaving(true);
    const algorithm =
      modelConfig?.algorithm ?? modelsFor(project.problem_type)[0]?.id ?? "random_forest";
    const payload = {
      user_id: user.id,
      project_id: project.id,
      algorithm,
      hyperparameters: (modelConfig?.hyperparameters as Record<string, number | string>) ?? {},
      preprocessing: config,
      train_split: split,
      updated_at: new Date().toISOString(),
    };
    const { error } = modelConfig
      ? await supabase.from("model_configs").update(payload).eq("id", modelConfig.id)
      : await supabase.from("model_configs").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("We couldn't save these settings.");
      return;
    }
    await logActivity({
      userId: user.id,
      projectId: project.id,
      projectName: project.name,
      action: "Preprocessing settings saved",
    });
    await queryClient.invalidateQueries();
    toast.success("Preprocessing settings saved.");
  };

  const missingColumns = columns.filter((column) => column.missing > 0);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Preprocessing"
        description="Prepare your data before training. Sensible defaults are already selected."
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Missing values</Label>
                <HelpHint>How to fill in blank cells before training.</HelpHint>
              </div>
              <Select
                value={config.missingStrategy}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    missingStrategy: value as PreprocessingConfig["missingStrategy"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mean">Fill with mean</SelectItem>
                  <SelectItem value="median">Fill with median</SelectItem>
                  <SelectItem value="mode">Fill with most common value</SelectItem>
                  <SelectItem value="drop">Drop rows with missing values</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {missingColumns.length
                  ? `${missingColumns.length} column(s) contain missing values.`
                  : "No missing values detected in this dataset."}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Categorical encoding</Label>
                <HelpHint>Turns text categories into numbers the model can use.</HelpHint>
              </div>
              <Select
                value={config.encoding}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    encoding: value as PreprocessingConfig["encoding"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onehot">One-hot encoding</SelectItem>
                  <SelectItem value="label">Label encoding</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Feature scaling</Label>
                <HelpHint>Puts numeric columns on a comparable scale.</HelpHint>
              </div>
              <Select
                value={config.scaling}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    scaling: value as PreprocessingConfig["scaling"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standardize">Standardize (mean 0, sd 1)</SelectItem>
                  <SelectItem value="normalize">Normalize (0 to 1)</SelectItem>
                  <SelectItem value="none">No scaling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-medium">Remove duplicate rows</p>
                <p className="text-xs text-muted-foreground">
                  Drops rows that appear more than once.
                </p>
              </div>
              <Switch
                checked={config.removeDuplicates}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, removeDuplicates: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Train / test split</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {split}% train · {100 - split}% test
                </span>
              </div>
              <Slider
                value={[split]}
                min={50}
                max={95}
                step={5}
                onValueChange={(value) => setSplit(value[0] ?? 80)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Input columns ({config.features.length} selected)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    features:
                      prev.features.length === featureColumns.length
                        ? []
                        : featureColumns.map((column) => column.name),
                  }))
                }
              >
                {config.features.length === featureColumns.length ? "Clear all" : "Select all"}
              </Button>
            </div>
            <div className="max-h-[22rem] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {featureColumns.map((column) => (
                <label
                  key={column.name}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface"
                >
                  <Checkbox
                    checked={config.features.includes(column.name)}
                    onCheckedChange={() => toggleFeature(column.name)}
                  />
                  <span className="flex-1 truncate">{column.name}</span>
                  <span className="text-xs text-muted-foreground">{column.type}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Target column{" "}
              <span className="font-medium text-foreground">{dataset.target_column}</span> is
              predicted and cannot be used as an input.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
