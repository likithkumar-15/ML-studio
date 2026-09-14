import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { BrandLockup } from "@/components/brand";
import { LoadingRows, SectionCard, SimulationBadge } from "@/components/common";
import { PredictionForm } from "@/components/prediction-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { fieldsFromExperiment } from "@/lib/predict";
import { useDataset, useDeployments, useExperiments, useGeneratedApp } from "@/lib/queries";
import type { AppField } from "@/lib/types";

export const Route = createFileRoute("/apps/$appId")({
  head: () => ({
    meta: [
      { title: "ML application — ML Studio" },
      { name: "description", content: "A generated ML-driven application in presentation mode." },
      { property: "og:title", content: "ML application — ML Studio" },
      {
        property: "og:description",
        content: "A generated ML-driven application in presentation mode.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GeneratedAppPage,
});

function GeneratedAppPage() {
  const { appId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const appQuery = useGeneratedApp(appId);
  const app = appQuery.data;
  const deployments = useDeployments();
  const experiments = useExperiments();
  const dataset = useDataset(app?.project_id ?? "");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { mode: "login", redirect: `/apps/${appId}` } });
    }
  }, [loading, user, navigate, appId]);

  const deployment = deployments.data?.find((d) => d.id === app?.deployment_id) ?? null;
  const experiment = experiments.data?.find((e) => e.id === deployment?.experiment_id) ?? null;
  const storedFields = (app?.fields as AppField[] | undefined) ?? [];
  const fields = storedFields.length
    ? storedFields
    : fieldsFromExperiment(experiment, dataset.data ?? null);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <BrandLockup />
          <Button asChild variant="ghost" size="sm">
            <Link to="/app-builder">
              <ArrowLeft className="size-4" /> Back to App Builder
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12">
        {appQuery.isLoading ? (
          <LoadingRows rows={3} />
        ) : !app ? (
          <SectionCard title="Application not found">
            <p className="text-sm text-muted-foreground">
              This application no longer exists or belongs to another workspace.
            </p>
          </SectionCard>
        ) : (
          <div className="panel p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{app.name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {app.description || "Enter the information below to get a prediction."}
                </p>
              </div>
              <SimulationBadge label="Simulated predictions" />
            </div>
            <div className="mt-8">
              <PredictionForm
                fields={fields}
                experiment={experiment}
                dataset={dataset.data ?? null}
                submitLabel="Predict"
                showJson={false}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
