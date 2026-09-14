import { useState } from "react";
import { Play } from "lucide-react";
import { toast } from "sonner";

import { SectionCard, SimulationBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fieldsFromExperiment, runPrediction, sampleInputs } from "@/lib/predict";
import type { DatasetRow, DeploymentRow, ExperimentRow } from "@/lib/types";

type ResponseState = {
  status: string;
  timeMs: number;
  body: Record<string, unknown>;
};

export function ApiPlayground({
  deployment,
  experiment,
  dataset,
}: {
  deployment: DeploymentRow;
  experiment: ExperimentRow | null;
  dataset: DatasetRow | null;
}) {
  const fields = fieldsFromExperiment(experiment, dataset);
  const [request, setRequest] = useState(() =>
    JSON.stringify(sampleInputs(fields, dataset), null, 2),
  );
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!experiment) {
      toast.error("This deployment has no trained experiment attached.");
      return;
    }
    let parsed: Record<string, string | number>;
    try {
      parsed = JSON.parse(request);
    } catch {
      setResponse({
        status: "400 Bad Request",
        timeMs: 2,
        body: { error: "Request body is not valid JSON." },
      });
      toast.error("That request body isn't valid JSON.");
      return;
    }

    setSending(true);
    try {
      const result = await runPrediction({ experiment, dataset, inputs: parsed });
      setResponse({
        status: "200 OK",
        timeMs: result.responseTimeMs,
        body: {
          prediction: result.prediction,
          confidence: result.confidence,
          model: experiment.algorithm,
          version: deployment.version,
          simulated: result.engine === "simulation",
        },
      });
    } catch {
      setResponse({
        status: "500 Internal Error",
        timeMs: 0,
        body: { error: "The prediction could not be completed." },
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <SectionCard
      title="API Playground"
      description={`Demo endpoint · ${deployment.endpoint}`}
      actions={<SimulationBadge label="Simulated response" />}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Request
            </p>
            <span className="font-mono text-xs text-muted-foreground">POST</span>
          </div>
          <Textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            rows={12}
            spellCheck={false}
            className="font-mono text-xs"
            aria-label="Request body"
          />
          <Button onClick={send} disabled={sending}>
            <Play className="size-4" />
            {sending ? "Sending…" : "Send Request"}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Response
            </p>
            {response ? (
              <span className="font-mono text-xs text-muted-foreground">
                {response.status} · {response.timeMs} ms
              </span>
            ) : null}
          </div>
          <pre className="min-h-[17rem] overflow-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs">
            {response
              ? JSON.stringify(response.body, null, 2)
              : "// Send a request to see the response here."}
          </pre>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        This endpoint URL is a demo placeholder and is not publicly reachable. Requests are answered
        locally by the built-in simulation engine.
      </p>
    </SectionCard>
  );
}
