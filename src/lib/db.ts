import { supabase } from "@/integrations/supabase/client";

export class AppError extends Error {}

/** Wraps a Supabase error into a calm, user-facing message. */
export function dbMessage(fallback: string) {
  return fallback;
}

export async function logActivity(input: {
  userId: string;
  projectId?: string | null;
  projectName?: string | null;
  action: string;
  status?: string;
}) {
  await supabase.from("activity_logs").insert({
    user_id: input.userId,
    project_id: input.projectId ?? null,
    project_name: input.projectName ?? null,
    action: input.action,
    status: input.status ?? "success",
  });
}

export async function touchProject(projectId: string, patch: Record<string, unknown> = {}) {
  await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString(), ...patch })
    .eq("id", projectId);
}

export const queryKeys = {
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  dataset: (projectId: string) => ["dataset", projectId] as const,
  modelConfig: (projectId: string) => ["model-config", projectId] as const,
  experiments: (projectId?: string) => ["experiments", projectId ?? "all"] as const,
  experiment: (id: string) => ["experiment", id] as const,
  deployments: (projectId?: string) => ["deployments", projectId ?? "all"] as const,
  apps: ["generated-apps"] as const,
  app: (id: string) => ["generated-app", id] as const,
  activity: ["activity"] as const,
  profile: ["profile"] as const,
  stats: ["stats"] as const,
};
