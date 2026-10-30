# 🧠 ML Studio

> **A unified AI development platform for designing, experimenting, evaluating, and deploying ML-driven applications — all from one interface.**

---

## 📚 Table of Contents

1. [Project Description](#-project-description)
2. [Key Features](#-key-features)
3. [ML Pipeline Workflow](#-ml-pipeline-workflow)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Installation & Setup](#-installation--setup)
7. [Environment Variables](#-environment-variables)
8. [Available Scripts](#-available-scripts)

---

## 📖 Project Description

**ML Studio** is a full-stack, browser-based platform that covers the complete machine-learning lifecycle in a single, cohesive environment. It enables users to:

- Upload and profile datasets (CSV support with column stats, missing-value detection)
- Configure preprocessing and model hyperparameters through simple form fields — no coding required
- Train models using classic ML algorithms with experiment tracking baked in
- Evaluate performance through rich metrics (accuracy, precision, recall, F1, confusion matrix, regression errors)
- Test trained models by sending live inputs and inspecting JSON-style responses
- Deploy models as prediction endpoints and generate working web applications

Training runs use a **built-in simulation engine** and are clearly labelled as demo results. The architecture is designed so a real Python training service can be swapped in without changes to the frontend.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📂 **Dataset Management** | Upload CSV files and get instant column profiling, missing-value counts, and a clean preview |
| 🧱 **Model Development** | Select from classic ML algorithms with only the settings that actually matter |
| 🔬 **Experiment Tracking** | Every training run is persisted with its full configuration, metrics, and duration |
| 📊 **Performance Evaluation** | Accuracy, precision, recall, F1, regression errors, and a confusion matrix |
| 🧪 **Model Testing** | Send inputs through your trained model and inspect the JSON response |
| 🚀 **Application Deployment** | Turn a trained model into an endpoint and a working prediction application |
| 🔐 **Authentication** | Secure login, signup, and password-reset flows powered by Supabase Auth |
| 🌗 **Theme Support** | Light and dark mode with a clean, accessible design system |

---

## 🔄 ML Pipeline Workflow

The platform guides you through a linear, six-stage pipeline where each stage hands off cleanly to the next:

```
Data → Preprocess → Model → Train → Test → Deploy
```

1. **Data** — Upload & profile your dataset
2. **Preprocess** — Configure feature engineering and cleaning options
3. **Model** — Pick an algorithm and set hyperparameters
4. **Train** — Launch a training run and track metrics in real time
5. **Test** — Evaluate the model against a held-out test set
6. **Deploy** — Publish the model and generate a prediction application

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI component library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [TanStack Router](https://tanstack.com/router) | File-based client-side routing |
| [TanStack Start](https://tanstack.com/start) | Full-stack React meta-framework |
| [TanStack Query](https://tanstack.com/query) | Server state management & data fetching |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [Radix UI](https://www.radix-ui.com/) | Accessible, unstyled component primitives |
| [Lucide React](https://lucide.dev/) | Icon library |
| [Recharts](https://recharts.org/) | Data visualisation & charting |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form management & validation |
| [Sonner](https://sonner.emilkowal.ski/) | Toast notifications |
| [date-fns](https://date-fns.org/) | Date utility functions |

### Backend & Database
| Technology | Purpose |
|---|---|
| [Supabase](https://supabase.com/) | PostgreSQL database, Auth, and real-time features |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database schema & query builder |
| [Nitro](https://nitro.unjs.io/) | Server engine (via TanStack Start) |

### Tooling
| Technology | Purpose |
|---|---|
| [Vite 8](https://vite.dev/) | Build tool & dev server |
| [Bun](https://bun.sh/) | Fast JavaScript runtime & package manager |
| [ESLint](https://eslint.org/) | Code linting |
| [Prettier](https://prettier.io/) | Code formatting |

---

## 📁 Project Structure

```
ML/
├── src/
│   ├── components/          # Reusable UI components (shadcn/ui + custom)
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integration clients
│   ├── lib/                 # Core business logic
│   │   ├── ml/              # ML simulation engine
│   │   ├── auth.tsx         # Auth helpers
│   │   ├── db.ts            # Database client
│   │   ├── predict.ts       # Model prediction logic
│   │   ├── queries.ts       # TanStack Query definitions
│   │   ├── types.ts         # Shared TypeScript types
│   │   └── workflow.ts      # Pipeline workflow utilities
│   ├── routes/              # File-based page routes
│   │   ├── index.tsx        # Landing page
│   │   ├── auth.tsx         # Login / Sign-up / Reset
│   │   ├── _app.tsx         # Authenticated app shell
│   │   └── _app/            # Protected app pages
│   │       ├── dashboard.tsx
│   │       ├── projects.index.tsx
│   │       ├── projects.$projectId.tsx
│   │       ├── experiments.index.tsx
│   │       ├── experiments.$experimentId.tsx
│   │       ├── deployments.tsx
│   │       ├── app-builder.tsx
│   │       ├── activity.tsx
│   │       └── settings.tsx
│   ├── styles.css           # Global styles & design tokens
│   ├── router.tsx           # Router configuration
│   └── server.ts            # Server entry point
├── drizzle/                 # Database schema & migrations
├── public/                  # Static assets
├── drizzle.config.ts        # Drizzle ORM configuration
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure you have the following installed before proceeding:

- **[Bun](https://bun.sh/)** `>= 1.0` — used as the package manager and runtime
  ```bash
  # Install Bun (Windows PowerShell)
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **[Node.js](https://nodejs.org/)** `>= 18` — required by some tooling
- A **[Supabase](https://supabase.com/)** account and project

### Step 1 — Clone the repository

```bash
git clone <your-repository-url>
cd "rohini project/ML"
```

### Step 2 — Install dependencies

```bash
bun install
```

### Step 3 — Configure environment variables

Create a `.env` file in the project root (or copy the existing one) and fill in your Supabase credentials:

```env
SUPABASE_PROJECT_ID="your_supabase_project_id"
SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
SUPABASE_URL="https://your_project_id.supabase.co"

VITE_SUPABASE_PROJECT_ID="your_supabase_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
```

> See the [Environment Variables](#-environment-variables) section for full details.

### Step 4 — Apply database migrations

```bash
bun run db:migrate
```

> If a `db:migrate` script is not present, run Drizzle migrations directly:
> ```bash
> bunx drizzle-kit migrate
> ```

### Step 5 — Start the development server

```bash
bun run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)** (or the port shown in the terminal).

---

## 🔐 Environment Variables

| Variable | Description | Required |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key | ✅ |
| `SUPABASE_PROJECT_ID` | Supabase project ID | ✅ |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` (exposed to Vite) | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as `SUPABASE_PUBLISHABLE_KEY` (Vite) | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | Same as `SUPABASE_PROJECT_ID` (Vite) | ✅ |
| `LOVABLE_DB_MIGRATION_URL` | PostgreSQL connection string for Drizzle migrations | Optional |

> ⚠️ **Never commit your `.env` file to version control.** It is already listed in `.gitignore`.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the development server with hot reload |
| `bun run build` | Build the production bundle |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint across the project |
| `bun run format` | Format all files with Prettier |

---

> Built with ❤️ using React, TanStack, Supabase, and Drizzle ORM.
