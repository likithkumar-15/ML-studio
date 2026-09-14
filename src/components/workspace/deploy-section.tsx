import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Rocket } from "lucide-react";

import { ApiPlayground } from "@/components/api-playground";
import { EmptyState, SectionCard, StatusPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity, touchProject } from "@/lib/db";
import { modelById } from "@/lib/ml/models";
import type { DatasetRow, DeploymentRow, ExperimentRow, ProjectRow } from "@/lib/types";
import { formatDateTime } from "@/lib/workflow";

export function DeploySection({
  project,
  dataset,
  experiments,
  deployments,
  onGoToTraining,
}: {
  project: ProjectRow;
  dataset: DatasetRow | null;
  experiments: ExperimentRow[];
  deployments: DeploymentRow[];
  onGoToTraining: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [experimentId, setExperimentId] = useState(experiments[0]?.id ?? "");
  const [deploying, setDeploying] = useState(false);
  const [openId, setOpenId] = useState<string | null>(deployments[0]?.id ?? null);

  const chosen = experiments.find((item) => item.id === experimentId) ?? experiments[0] ?? null;
  const active = deployments.find((item) => item.id === openId) ?? null;
  const activeExperiment = experiments.find((item) => item.id === active?.experiment_id) ?? null;

  if (experiments.length === 0) {
    return (
      <SectionCard title="Deploy">
        <EmptyState
          icon={<Rocket className="size-5" />}
          title="No trained model to deploy"
          description="Train a model first — deployments are created from a completed run."
          action={<Button onClick={onGoToTraining}>Go to training</Button>}
        />
      </SectionCard>
    );
  }

  const deploy = async () => {
    if (!user || !chosen) return;
    setDeploying(true);
    const version = `v${deployments.length + 1}`;
    const { error } = await supabase.from("deployments").insert({
      user_id: user.id,
      project_id: project.id,
      experiment_id: chosen.id,
      name: `${project.name} — ${modelById(chosen.algorithm)?.name ?? chosen.algorithm}`,
      version,
      endpoint: `https://demo.ml-studio.local/api/predict/${project.id}/${version}`,
      status: "active",
    });
    setDeploying(false);
    if (error) {
      toast.error("We couldn't create this deployment.");
      return;
    }
    await touchProject(project.id, { status: "deployed" });
    await logActivity({
      userId: user.id,
      projectId: project.id,
      projectName: project.name,
      action: `Model deployed (${version})`,
    });
    await queryClient.invalidateQueries();
    toast.success(`Deployment ${version} is live in demo mode.`);
  };

  const copy = async (endpoint: string) => {
    try {
      await navigator.clipboard.writeText(endpoint);
      toast.success("Demo endpoint copied.");
    } catch {
      toast.error("Your browser blocked copying. Select the URL manually.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Deploy a run"
        description="Creates a versioned deployment record with a demo prediction endpoint."
        actions={
          <Button onClick={deploy} disabled={deploying || !chosen}>
            <Rocket className="size-4" />
            {deploying ? "Deploying…" : "Deploy Model"}
          </Button>
        }
      >
        <div className="max-w-sm space-y-1.5">
          <Label>Run to deploy</Label>
          <Select value={chosen?.id ?? ""} onValueChange={setExperimentId}>
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
        <p className="mt-4 text-xs text-muted-foreground">
          The endpoint URL is a demo placeholder and is not publicly reachable. Requests made in the
          API playground are answered locally by the simulation engine.
        </p>
      </SectionCard>

      <SectionCard title="Deployments" bodyClassName="p-0">
        {deployments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Rocket className="size-5" />}
              title="No deployments yet"
              description="Deploy a run to create its demo endpoint."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {deployments.map((deployment) => (
              <li
                key={deployment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{deployment.version}</p>
                    <StatusPill status={deployment.status} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {deployment.endpoint}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {formatDateTime(deployment.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copy(deployment.endpoint)}>
                    <Copy className="size-3.5" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenId(openId === deployment.id ? null : deployment.id)}
                  >
                    {openId === deployment.id ? "Hide API" : "Test API"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {active ? (
        <ApiPlayground deployment={active} experiment={activeExperiment} dataset={dataset} />
      ) : null}
    </div>
  );
}
