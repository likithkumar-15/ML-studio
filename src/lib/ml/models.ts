import type { ProblemType } from "../types";

export type HyperParam = {
  key: string;
  label: string;
  type: "number" | "select";
  default: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  help: string;
};

export type ModelSpec = {
  id: string;
  name: string;
  problemTypes: ProblemType[];
  description: string;
  recommended: string;
  params: HyperParam[];
};

const randomState: HyperParam = {
  key: "random_state",
  label: "Random State",
  type: "number",
  default: 42,
  min: 0,
  max: 9999,
  step: 1,
  help: "A fixed seed so results can be reproduced.",
};

export const MODELS: ModelSpec[] = [
  {
    id: "logistic_regression",
    name: "Logistic Regression",
    problemTypes: ["classification", "nlp"],
    description: "A fast linear model that estimates the probability of each class.",
    recommended: "Strong baseline for clean, mostly linear data.",
    params: [
      {
        key: "C",
        label: "C Value",
        type: "number",
        default: 1,
        min: 0.01,
        max: 100,
        step: 0.01,
        help: "Lower values apply stronger regularisation.",
      },
      randomState,
    ],
  },
  {
    id: "decision_tree",
    name: "Decision Tree",
    problemTypes: ["classification"],
    description: "Splits the data into simple yes/no rules that are easy to read.",
    recommended: "When you need an explainable model.",
    params: [
      {
        key: "max_depth",
        label: "Maximum Depth",
        type: "number",
        default: 6,
        min: 1,
        max: 40,
        step: 1,
        help: "How many questions deep the tree can go. Deeper trees can overfit.",
      },
      randomState,
    ],
  },
  {
    id: "random_forest",
    name: "Random Forest",
    problemTypes: ["classification", "computer_vision"],
    description: "Combines many decision trees and averages their votes.",
    recommended: "A reliable all-rounder for tabular data.",
    params: [
      {
        key: "n_estimators",
        label: "Number of Trees",
        type: "number",
        default: 200,
        min: 10,
        max: 1000,
        step: 10,
        help: "More trees usually means steadier results and slower training.",
      },
      {
        key: "max_depth",
        label: "Maximum Depth",
        type: "number",
        default: 12,
        min: 1,
        max: 60,
        step: 1,
        help: "Limits how complex each tree can become.",
      },
      randomState,
    ],
  },
  {
    id: "svm",
    name: "Support Vector Machine",
    problemTypes: ["classification", "nlp"],
    description: "Finds the boundary that separates classes with the widest margin.",
    recommended: "Smaller datasets with clear separation between classes.",
    params: [
      {
        key: "kernel",
        label: "Kernel",
        type: "select",
        default: "rbf",
        options: ["linear", "rbf", "poly"],
        help: "The shape of the boundary the model is allowed to draw.",
      },
      {
        key: "C",
        label: "C Value",
        type: "number",
        default: 1,
        min: 0.01,
        max: 100,
        step: 0.01,
        help: "Higher values fit the training data more tightly.",
      },
    ],
  },
  {
    id: "knn",
    name: "K-Nearest Neighbors",
    problemTypes: ["classification"],
    description: "Predicts by looking at the most similar records in the dataset.",
    recommended: "Small datasets where similar records share outcomes.",
    params: [
      {
        key: "n_neighbors",
        label: "Number of Neighbors",
        type: "number",
        default: 5,
        min: 1,
        max: 50,
        step: 1,
        help: "How many nearby records vote on the prediction.",
      },
    ],
  },
  {
    id: "linear_regression",
    name: "Linear Regression",
    problemTypes: ["regression"],
    description: "Fits a straight-line relationship between features and the target.",
    recommended: "A clear, interpretable baseline for numeric targets.",
    params: [],
  },
  {
    id: "decision_tree_regressor",
    name: "Decision Tree Regressor",
    problemTypes: ["regression"],
    description: "Predicts numbers using simple rule-based splits.",
    recommended: "Non-linear relationships you still want to explain.",
    params: [
      {
        key: "max_depth",
        label: "Maximum Depth",
        type: "number",
        default: 8,
        min: 1,
        max: 40,
        step: 1,
        help: "Limits how complex the rules can become.",
      },
      randomState,
    ],
  },
  {
    id: "random_forest_regressor",
    name: "Random Forest Regressor",
    problemTypes: ["regression"],
    description: "Averages many regression trees for steadier numeric predictions.",
    recommended: "Best general choice for numeric prediction on tabular data.",
    params: [
      {
        key: "n_estimators",
        label: "Number of Trees",
        type: "number",
        default: 200,
        min: 10,
        max: 1000,
        step: 10,
        help: "More trees usually means steadier results.",
      },
      {
        key: "max_depth",
        label: "Maximum Depth",
        type: "number",
        default: 12,
        min: 1,
        max: 60,
        step: 1,
        help: "Limits how complex each tree can become.",
      },
      randomState,
    ],
  },
  {
    id: "kmeans",
    name: "K-Means",
    problemTypes: ["clustering"],
    description: "Groups records into a chosen number of clusters by similarity.",
    recommended: "Finding natural segments when there is no target column.",
    params: [
      {
        key: "n_clusters",
        label: "Number of Clusters",
        type: "number",
        default: 3,
        min: 2,
        max: 20,
        step: 1,
        help: "How many groups the data should be split into.",
      },
      randomState,
    ],
  },
];

export function modelsFor(problemType: string) {
  const matches = MODELS.filter((m) => m.problemTypes.includes(problemType as ProblemType));
  return matches.length ? matches : MODELS.filter((m) => m.problemTypes.includes("classification"));
}

export function modelById(id: string | null | undefined) {
  return MODELS.find((m) => m.id === id) ?? null;
}

export function defaultParams(model: ModelSpec): Record<string, number | string> {
  return Object.fromEntries(model.params.map((p) => [p.key, p.default]));
}
