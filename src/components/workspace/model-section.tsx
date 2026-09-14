import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

import { HelpHint, SectionCard } from "@/components/common";
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
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { defaultParams, modelsFor } from "@/lib/ml/models";
import { DEFAULT_PREPROCESSING } from "@/lib/types";
import type { ModelConfigRow, PreprocessingConfig, ProjectRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ModelSection({
  project,
  modelConfig,
}: {
  project: ProjectRow;
  modelConfig: ModelConfigRow | null;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const models = modelsFor(project.problem_type);
  const [algorithm, setAlgorithm] = useState(modelConfig?.algorithm ?? models[0]?.id ?? "");
  const [params, setParams] = useState<Record<string, number | string>>(() => {
    const stored = (modelConfig?.hyperparameters as Record<string, number | string>) ?? {};
    const model = models.find((item) => item.id === (modelConfig?.algorithm ?? models[0]?.id));
    return { ...(model ? defaultParams(model) : {}), ...stored };
  });
  const [saving, setSaving] = useState(false);

  const selected = models.find((model) => model.id === algorithm) ?? models[0];

  const pick = (id: string) => {
    setAlgorithm(id);
    const model = models.find((item) => item.id === id);
    setParams(model ? defaultParams(model) : {});
  };

  const save = async () => {
    if (!user || !selected) return;
    setSaving(true);
    const preprocessing =
      (modelConfig?.preprocessing as PreprocessingConfig | undefined) ?? DEFAULT_PREPROCESSING;
    const payload = {
      user_id: user.id,
      project_id: project.id,
      algorithm: selected.id,
      hyperparameters: params,
      preprocessing,
      train_split: modelConfig?.train_split ?? 80,
      updated_at: new Date().toISOString(),
    };
    const { error } = modelConfig
      ? await supabase.from("model_configs").update(payload).eq("id", modelConfig.id)
      : await supabase.from("model_configs").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("We couldn't save the model configuration.");
      return;
    }
    await logActivity({
      userId: user.id,
      projectId: project.id,
      projectName: project.name,
      action: `Model selected (${selected.name})`,
    });
    await queryClient.invalidateQueries();
    toast.success("Model configuration saved.");
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Model selection"
        description={`Algorithms suited to ${project.problem_type.replace("_", " ")} problems.`}
        actions={
          <Button onClick={save} disabled={saving || !selected}>
            {saving ? "Saving…" : "Save Configuration"}
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => {
            const isActive = model.id === algorithm;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => pick(model.id)}
                aria-pressed={isActive}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-surface",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{model.name}</p>
                  {isActive ? <Check className="size-4 text-primary" /> : null}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{model.description}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-primary">
                  <Sparkles className="size-3" /> {model.recommended}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {selected ? (
        <SectionCard
          title="Hyperparameters"
          description="Each setting has a plain-language explanation and a safe default."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {selected.params.map((param) => (
              <div key={param.key} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`param-${param.key}`}>{param.label}</Label>
                    <HelpHint>{param.help}</HelpHint>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {String(params[param.key] ?? param.default)}
                  </span>
                </div>

                {param.type === "select" ? (
                  <Select
                    value={String(params[param.key] ?? param.default)}
                    onValueChange={(value) =>
                      setParams((prev) => ({ ...prev, [param.key]: value }))
                    }
                  >
                    <SelectTrigger id={`param-${param.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(param.options ?? []).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : param.min !== undefined && param.max !== undefined ? (
                  <Slider
                    value={[Number(params[param.key] ?? param.default)]}
                    min={param.min}
                    max={param.max}
                    step={param.step ?? 1}
                    onValueChange={(value) =>
                      setParams((prev) => ({ ...prev, [param.key]: value[0] ?? param.default }))
                    }
                  />
                ) : (
                  <Input
                    id={`param-${param.key}`}
                    type="number"
                    value={String(params[param.key] ?? param.default)}
                    onChange={(event) =>
                      setParams((prev) => ({ ...prev, [param.key]: Number(event.target.value) }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setParams(defaultParams(selected))}>
              Reset to defaults
            </Button>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
