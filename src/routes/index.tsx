import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Database,
  FlaskConical,
  GaugeCircle,
  Layers,
  Rocket,
  TestTube2,
} from "lucide-react";

import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { WorkflowStepper } from "@/components/workflow-stepper";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ML Studio — Build, Test and Deploy ML Applications" },
      {
        name: "description",
        content:
          "A unified AI development platform for designing, experimenting, evaluating and deploying ML-driven applications.",
      },
      { property: "og:title", content: "ML Studio — Build, Test and Deploy ML Applications" },
      {
        property: "og:description",
        content:
          "Upload data, configure preprocessing, train models, compare experiments and deploy an ML-driven application from one interface.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Database,
    title: "Dataset Management",
    body: "Upload a CSV and get instant column profiling, missing-value counts and a clean preview.",
  },
  {
    icon: Layers,
    title: "Model Development",
    body: "Pick from classic algorithms with only the settings that actually matter.",
  },
  {
    icon: FlaskConical,
    title: "Experiment Tracking",
    body: "Every training run is stored with its configuration, metrics and duration.",
  },
  {
    icon: GaugeCircle,
    title: "Performance Evaluation",
    body: "Accuracy, precision, recall, F1, regression errors and a confusion matrix.",
  },
  {
    icon: TestTube2,
    title: "Model Testing",
    body: "Send inputs through your model and inspect a JSON-style response.",
  },
  {
    icon: Rocket,
    title: "Application Deployment",
    body: "Turn a trained model into an endpoint and a working prediction app.",
  },
];

const PIPELINE = ["Data", "Preprocess", "Model", "Train", "Test", "Deploy"];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="ML Studio home">
            <BrandLockup />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              Workflow
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              About
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ mode: "login", redirect: undefined }}>
                Login
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                Get Started
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="grid-backdrop pointer-events-none absolute inset-0 opacity-60"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:py-32">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              The complete machine-learning lifecycle
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Build, Test and Deploy Machine Learning Applications
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              A unified AI development platform for designing, experimenting, evaluating and
              deploying ML-driven applications.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                  Start Building
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#workflow">Explore Platform</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                One workflow, start to finish
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Each stage hands off to the next, so a project always shows exactly where it stands.
              </p>
            </div>
            <div className="mt-9 panel p-6">
              <WorkflowStepper
                stages={PIPELINE.map((label, i) => ({
                  key: label,
                  label: label.toUpperCase(),
                  state: i === 0 ? "current" : "todo",
                }))}
              />
              <div className="mt-6 grid gap-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-medium">Configure, don't code</p>
                  <p className="mt-1 text-muted-foreground">
                    Preprocessing and hyperparameters are plain form fields with short explanations.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Track every run</p>
                  <p className="mt-1 text-muted-foreground">
                    Experiments keep their metrics and settings so you can compare fairly.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Ship an application</p>
                  <p className="mt-1 text-muted-foreground">
                    Generate a working prediction interface from a deployed model.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything the lifecycle needs
            </h2>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="panel p-5 transition-shadow hover:shadow-lift">
                  <Icon className="size-5 text-primary" />
                  <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="bg-surface">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">About ML Studio</h2>
            <p className="mt-4 text-sm text-muted-foreground sm:text-base">
              ML Studio demonstrates how machine-learning applications are designed, developed,
              tested, evaluated and deployed inside a single environment. Training runs use a
              built-in simulation engine and are clearly labelled as demo results — the architecture
              is ready for a real Python training service to take over.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "signup", redirect: undefined }}>
                  Create your workspace
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <BrandLockup className="text-foreground" />
          <p>Designing, testing and deploying ML-driven applications.</p>
        </div>
      </footer>
    </div>
  );
}
