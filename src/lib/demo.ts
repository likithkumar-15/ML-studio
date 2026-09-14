import { supabase } from "@/integrations/supabase/client";
import { parseCsv } from "./csv";
import { logActivity } from "./db";
import { DEFAULT_PREPROCESSING } from "./types";

export const DEMO_CSV = `age,income,credit_score,employment_years,loan_amount,existing_loans,approved
34,52000,712,6,15000,1,Approved
23,28000,631,1,9000,2,Rejected
45,88000,780,14,32000,0,Approved
52,64000,690,20,21000,3,Rejected
29,41000,655,3,12000,1,Approved
38,73000,745,11,26000,1,Approved
41,35000,602,4,18000,3,Rejected
26,47000,701,2,10000,0,Approved
57,96000,802,25,40000,1,Approved
31,39000,648,5,14000,2,Rejected
48,81000,764,17,29000,0,Approved
22,26000,590,1,7000,1,Rejected
36,58000,722,8,19000,1,Approved
44,67000,738,13,24000,2,Approved
50,44000,615,16,17000,3,Rejected
28,51000,706,4,13000,0,Approved
39,79000,758,10,27000,1,Approved
33,37000,634,6,11000,2,Rejected
46,92000,791,19,35000,0,Approved
25,33000,620,2,8500,1,Rejected
55,71000,749,22,25000,1,Approved
30,49000,688,5,16000,2,Approved
42,42000,611,9,15500,3,Rejected
37,84000,772,12,31000,0,Approved`;

/** Creates a fully worked demo project so the platform is never empty in a demo. */
export async function createDemoProject(userId: string) {
  const parsed = parseCsv(DEMO_CSV);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: "Customer Loan Approval (Demo)",
      description:
        "Sample project showing the full lifecycle: dataset, preprocessing, Random Forest, evaluation and a deployed demo endpoint.",
      problem_type: "classification",
      status: "deployed",
      is_demo: true,
    })
    .select()
    .single();
  if (projectError || !project) throw new Error("We couldn't create the demo project.");

  const features = parsed.headers.filter((h) => h !== "approved");

  await supabase.from("datasets").insert({
    user_id: userId,
    project_id: project.id,
    name: "loan_applications.csv",
    file_size: new Blob([DEMO_CSV]).size,
    row_count: parsed.rowCount,
    column_count: parsed.headers.length,
    target_column: "approved",
    columns: parsed.columns,
    preview_rows: parsed.previewRows,
  });

  await supabase.from("model_configs").insert({
    user_id: userId,
    project_id: project.id,
    algorithm: "random_forest",
    hyperparameters: { n_estimators: 200, max_depth: 12, random_state: 42 },
    preprocessing: { ...DEFAULT_PREPROCESSING, features },
    train_split: 80,
  });

  const { data: experiment } = await supabase
    .from("experiments")
    .insert({
      user_id: userId,
      project_id: project.id,
      name: "Experiment #1 · Random Forest",
      algorithm: "random_forest",
      problem_type: "classification",
      dataset_name: "loan_applications.csv",
      target_column: "approved",
      metrics: { accuracy: 0.924, precision: 0.918, recall: 0.907, f1: 0.912 },
      confusion_matrix: {
        labels: ["Approved", "Rejected"],
        matrix: [
          [58, 4],
          [5, 44],
        ],
      },
      hyperparameters: { n_estimators: 200, max_depth: 12, random_state: 42 },
      preprocessing: { ...DEFAULT_PREPROCESSING, features },
      feature_names: features,
      duration_ms: 3240,
      status: "completed",
      engine: "simulation",
    })
    .select()
    .single();

  if (experiment) {
    await supabase.from("deployments").insert({
      user_id: userId,
      project_id: project.id,
      experiment_id: experiment.id,
      name: "loan-approval-demo",
      version: "v1",
      endpoint: `https://api.mlstudio.demo/v1/${project.id.slice(0, 8)}/predict`,
      status: "active",
    });
  }

  await logActivity({
    userId,
    projectId: project.id,
    projectName: project.name,
    action: "Demo project created",
  });

  return project;
}
