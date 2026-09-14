import type { Database } from "@/integrations/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type DatasetRow = Database["public"]["Tables"]["datasets"]["Row"];
export type ModelConfigRow = Database["public"]["Tables"]["model_configs"]["Row"];
export type ExperimentRow = Database["public"]["Tables"]["experiments"]["Row"];
export type DeploymentRow = Database["public"]["Tables"]["deployments"]["Row"];
export type GeneratedAppRow = Database["public"]["Tables"]["generated_apps"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type ProblemType =
  "classification" | "regression" | "clustering" | "computer_vision" | "nlp";

export type ProjectStatus = "draft" | "development" | "testing" | "ready" | "deployed";

export const PROBLEM_TYPES: { value: ProblemType; label: string; hint: string }[] = [
  { value: "classification", label: "Classification", hint: "Predict a category or label" },
  { value: "regression", label: "Regression", hint: "Predict a continuous number" },
  { value: "clustering", label: "Clustering", hint: "Group similar records together" },
  { value: "computer_vision", label: "Computer Vision", hint: "Work with image data" },
  { value: "nlp", label: "Natural Language Processing", hint: "Work with text data" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "development", label: "Development" },
  { value: "testing", label: "Testing" },
  { value: "ready", label: "Ready" },
  { value: "deployed", label: "Deployed" },
];

export type ColumnProfile = {
  name: string;
  type: "numeric" | "categorical";
  missing: number;
  unique: number;
  min?: number;
  max?: number;
  mean?: number;
  sampleValues: string[];
};

export type PreprocessingConfig = {
  missingStrategy: "mean" | "median" | "mode" | "drop";
  encoding: "onehot" | "label";
  scaling: "none" | "normalize" | "standardize";
  removeDuplicates: boolean;
  features: string[];
};

export const DEFAULT_PREPROCESSING: PreprocessingConfig = {
  missingStrategy: "mean",
  encoding: "onehot",
  scaling: "standardize",
  removeDuplicates: true,
  features: [],
};

export type Metrics = {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  r2?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  silhouette?: number;
  clusters?: number;
};

export type AppField = {
  name: string;
  label: string;
  type: "numeric" | "categorical";
  options?: string[];
};
