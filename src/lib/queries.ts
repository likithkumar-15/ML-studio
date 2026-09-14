import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { queryKeys } from "./db";
import type {
  ActivityRow,
  DatasetRow,
  DeploymentRow,
  ExperimentRow,
  GeneratedAppRow,
  ModelConfigRow,
  ProfileRow,
  ProjectRow,
} from "./types";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async (): Promise<ProjectRow[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw new Error("We couldn't load your projects.");
      return data ?? [];
    },
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: async (): Promise<ProjectRow | null> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw new Error("We couldn't load this project.");
      return data;
    },
  });
}

export function useDataset(projectId: string) {
  return useQuery({
    queryKey: queryKeys.dataset(projectId),
    queryFn: async (): Promise<DatasetRow | null> => {
      const { data, error } = await supabase
        .from("datasets")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error("We couldn't load the dataset.");
      return data;
    },
    enabled: Boolean(projectId),
  });
}

export function useModelConfig(projectId: string) {
  return useQuery({
    queryKey: queryKeys.modelConfig(projectId),
    queryFn: async (): Promise<ModelConfigRow | null> => {
      const { data, error } = await supabase
        .from("model_configs")
        .select("*")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error("We couldn't load the model configuration.");
      return data;
    },
    enabled: Boolean(projectId),
  });
}

export function useExperiments(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.experiments(projectId),
    queryFn: async (): Promise<ExperimentRow[]> => {
      let query = supabase
        .from("experiments")
        .select("*")
        .order("created_at", { ascending: false });
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw new Error("We couldn't load your experiments.");
      return data ?? [];
    },
  });
}

export function useExperiment(experimentId: string) {
  return useQuery({
    queryKey: queryKeys.experiment(experimentId),
    queryFn: async (): Promise<ExperimentRow | null> => {
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .eq("id", experimentId)
        .maybeSingle();
      if (error) throw new Error("We couldn't load this experiment.");
      return data;
    },
  });
}

export function useDeployments(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.deployments(projectId),
    queryFn: async (): Promise<DeploymentRow[]> => {
      let query = supabase
        .from("deployments")
        .select("*")
        .order("created_at", { ascending: false });
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw new Error("We couldn't load your deployments.");
      return data ?? [];
    },
  });
}

export function useGeneratedApps() {
  return useQuery({
    queryKey: queryKeys.apps,
    queryFn: async (): Promise<GeneratedAppRow[]> => {
      const { data, error } = await supabase
        .from("generated_apps")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error("We couldn't load your applications.");
      return data ?? [];
    },
  });
}

export function useGeneratedApp(appId: string) {
  return useQuery({
    queryKey: queryKeys.app(appId),
    queryFn: async (): Promise<GeneratedAppRow | null> => {
      const { data, error } = await supabase
        .from("generated_apps")
        .select("*")
        .eq("id", appId)
        .maybeSingle();
      if (error) throw new Error("We couldn't load this application.");
      return data;
    },
  });
}

export function useActivity(limit = 50) {
  return useQuery({
    queryKey: [...queryKeys.activity, limit],
    queryFn: async (): Promise<ActivityRow[]> => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error("We couldn't load recent activity.");
      return data ?? [];
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw new Error("We couldn't load your profile.");
      if (data) return data;
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: auth.user.id, email: auth.user.email ?? null })
        .select()
        .maybeSingle();
      return created ?? null;
    },
  });
}
