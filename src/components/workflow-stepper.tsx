import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkflowStage = {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
};

export function WorkflowStepper({
  stages,
  orientation = "horizontal",
}: {
  stages: WorkflowStage[];
  orientation?: "horizontal" | "vertical";
}) {
  return (
    <ol
      className={cn(
        "flex gap-2",
        orientation === "horizontal" ? "flex-wrap items-center" : "flex-col",
      )}
    >
      {stages.map((stage, index) => (
        <li key={stage.key} className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              stage.state === "done" && "border-success/40 bg-success/10 text-success",
              stage.state === "current" && "border-primary bg-primary/10 text-primary",
              stage.state === "todo" && "border-border bg-surface text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[10px]",
                stage.state === "done" && "bg-success text-success-foreground",
                stage.state === "current" && "bg-primary text-primary-foreground",
                stage.state === "todo" && "border border-border",
              )}
            >
              {stage.state === "done" ? <Check className="size-2.5" strokeWidth={3} /> : null}
              {stage.state === "current" ? (
                <span className="size-1.5 rounded-full bg-current" />
              ) : null}
            </span>
            {stage.label}
          </div>
          {index < stages.length - 1 && orientation === "horizontal" ? (
            <span className="h-px w-4 bg-border" aria-hidden />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
