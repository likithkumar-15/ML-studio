import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FolderKanban, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { EmptyState, LoadingRows, PageHeader, SectionCard, StatusPill } from "@/components/common";
import { NewProjectDialog } from "@/components/new-project-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/db";
import { useProjects } from "@/lib/queries";
import { PROBLEM_TYPES } from "@/lib/types";
import { formatDate } from "@/lib/workflow";

export const Route = createFileRoute("/_app/projects/")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Projects — ML Studio" },
      { name: "description", content: "Create and manage your machine learning projects." },
      { property: "og:title", content: "Projects — ML Studio" },
      { property: "og:description", content: "Create and manage your machine learning projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { q } = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const projects = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState(q ?? "");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const rows = (projects.data ?? []).filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || project.problem_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const remove = async () => {
    if (!pendingDelete || !user) return;
    const { error } = await supabase.from("projects").delete().eq("id", pendingDelete.id);
    if (error) {
      toast.error("We couldn't delete that project. Please try again.");
      return;
    }
    await logActivity({
      userId: user.id,
      projectName: pendingDelete.name,
      action: "Project deleted",
    });
    await queryClient.invalidateQueries();
    toast.success("Project deleted.");
    setPendingDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Each project holds one dataset, its preprocessing, models and experiments."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> New Project
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects"
          className="sm:max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All problem types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All problem types</SelectItem>
            {PROBLEM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SectionCard bodyClassName="p-0">
        {projects.isLoading ? (
          <div className="p-5">
            <LoadingRows rows={4} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<FolderKanban className="size-5" />}
              title="No projects found"
              description={
                (projects.data ?? []).length === 0
                  ? "You haven't created a machine learning project yet."
                  : "No project matches your search. Try a different name or filter."
              }
              action={<Button onClick={() => setDialogOpen(true)}>Create Project</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Problem type</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((project) => (
                  <tr key={project.id} className="transition-colors hover:bg-surface">
                    <td className="max-w-xs px-5 py-3">
                      <Link
                        to="/projects/$projectId"
                        params={{ projectId: project.id }}
                        search={{ tab: "overview" }}
                        className="font-medium hover:text-primary"
                      >
                        {project.name}
                      </Link>
                      {project.description ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">
                      {project.problem_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={project.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${project.name}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to="/projects/$projectId"
                              params={{ projectId: project.id }}
                              search={{ tab: "overview" }}
                            >
                              Open workspace
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to="/projects/$projectId"
                              params={{ projectId: project.id }}
                              search={{ tab: "settings" }}
                            >
                              Edit details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPendingDelete({ id: project.id, name: project.name })}
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <NewProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” and its dataset, experiments and deployments will be removed.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
