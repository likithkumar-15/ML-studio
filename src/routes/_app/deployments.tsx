import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Rocket } from "lucide-react";

import { ApiPlayground } from "@/components/api-playground";
import { EmptyState, LoadingRows, PageHeader, SectionCard, StatusPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { modelById } from "@/lib/ml/models";
import { useDataset, useDeployments, useExperiments, useProjects } from "@/lib/queries";
import { formatDateTime } from "@/lib/workflow";

export const Route = createFileRoute("/_app/deployments")({
  head: () => ({
    meta: [
      { title: "Deployments — ML Studio" },
      {
        name: "description",
        content: "Manage model deployments and test their demo prediction endpoints.",
      },
      { property: "og:title", content: "Deployments — ML Studio" },
      { property: "og:description", content: "Manage deployments and test prediction endpoints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DeploymentsPage,
});

function DeploymentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const deployments = useDeployments();
  const projects = useProjects();
  const experiments = useExperiments();
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = deployments.data ?? [];
  const active = rows.find((d) => d.id === openId) ?? null;
  const activeExperiment = experiments.data?.find((e) => e.id === active?.experiment_id) ?? null;
  const dataset = useDataset(active?.project_id ?? "");

  const projectName = (id: string) => projects.data?.find((p) => p.id === id)?.name ?? "—";

  const copyEndpoint = async (endpoint: string) => {
    try {
      await navigator.clipboard.writeText(endpoint);
      toast.success("Demo endpoint copied.");
    } catch {
      toast.error("Your browser blocked copying. Select the URL manually.");
    }
  };

  const setStatus = async (id: string, status: string, projectId: string) => {
    const { error } = await supabase.from("deployments").update({ status }).eq("id", id);
    if (error) {
      toast.error("We couldn't update that deployment.");
      return;
    }
    if (user) {
      await logActivity({
        userId: user.id,
        projectId,
        projectName: projectName(projectId),
        action: status === "active" ? "Deployment redeployed" : "Deployment disabled",
      });
    }
    await queryClient.invalidateQueries();
    toast.success(status === "active" ? "Deployment is live again." : "Deployment disabled.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deployments"
        description="Every deployed model, its version and its demo prediction endpoint."
      />

      <SectionCard bodyClassName="p-0">
        {deployments.isLoading ? (
          <div className="p-5">
            <LoadingRows rows={3} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Rocket className="size-5" />}
              title="No deployments yet"
              description="Deploy a trained model to create an API endpoint."
              action={
                <Button asChild>
                  <Link to="/projects">Go to projects</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((deployment) => (
              <li key={deployment.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{deployment.name}</p>
                      <StatusPill status={deployment.status} />
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        {deployment.version}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {projectName(deployment.project_id)} ·{" "}
                      {modelById(
                        experiments.data?.find((e) => e.id === deployment.experiment_id)?.algorithm,
                      )?.name ?? "Model"}{" "}
                      · created {formatDateTime(deployment.created_at)}
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-surface px-2.5 py-1 font-mono text-xs">
                      {deployment.endpoint}
                      <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-warning-foreground">
                        Demo endpoint
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyEndpoint(deployment.endpoint)}
                    >
                      <Copy className="size-3.5" /> Copy Endpoint
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenId(openId === deployment.id ? null : deployment.id)}
                    >
                      {openId === deployment.id ? "Hide API" : "Test API"}
                    </Button>
                    {deployment.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus(deployment.id, "disabled", deployment.project_id)}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatus(deployment.id, "active", deployment.project_id)}
                      >
                        Redeploy
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {active ? (
        <ApiPlayground
          deployment={active}
          experiment={activeExperiment}
          dataset={dataset.data ?? null}
        />
      ) : null}
    </div>
  );
}
