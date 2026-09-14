import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database, Trash2, Upload } from "lucide-react";

import { EmptyState, SectionCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CsvError, formatBytes, parseCsv } from "@/lib/csv";
import { logActivity, touchProject } from "@/lib/db";
import type { ColumnProfile, DatasetRow, ProjectRow } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;

export function DatasetSection({
  project,
  dataset,
}: {
  project: ProjectRow;
  dataset: DatasetRow | null;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const columns = (dataset?.columns as ColumnProfile[] | undefined) ?? [];
  const previewRows = (dataset?.preview_rows as Record<string, string>[] | undefined) ?? [];

  const handleFile = async (file: File) => {
    setError("");
    if (!user) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${formatBytes(file.size)}. Please keep uploads under 5 MB.`);
      return;
    }

    setUploading(true);
    try {
      const parsed = parseCsv(await file.text());
      if (dataset) {
        await supabase.from("datasets").delete().eq("id", dataset.id);
      }
      const { error: insertError } = await supabase.from("datasets").insert({
        user_id: user.id,
        project_id: project.id,
        name: file.name,
        file_size: file.size,
        row_count: parsed.rowCount,
        column_count: parsed.headers.length,
        columns: parsed.columns,
        preview_rows: parsed.previewRows,
        target_column: null,
      });
      if (insertError) throw new Error("We couldn't save this dataset. Please try again.");

      await touchProject(project.id, { status: "development" });
      await logActivity({
        userId: user.id,
        projectId: project.id,
        projectName: project.name,
        action: `Dataset uploaded (${file.name})`,
      });
      await queryClient.invalidateQueries();
      toast.success(`${parsed.rowCount.toLocaleString()} rows loaded.`);
    } catch (caught) {
      const message =
        caught instanceof CsvError || caught instanceof Error
          ? caught.message
          : "We couldn't read that file.";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const setTarget = async (value: string) => {
    if (!dataset || !user) return;
    const { error: updateError } = await supabase
      .from("datasets")
      .update({ target_column: value })
      .eq("id", dataset.id);
    if (updateError) {
      toast.error("We couldn't save the target column.");
      return;
    }
    await logActivity({
      userId: user.id,
      projectId: project.id,
      projectName: project.name,
      action: `Target column set to "${value}"`,
    });
    await queryClient.invalidateQueries();
    toast.success("Target column saved.");
  };

  const removeDataset = async () => {
    if (!dataset) return;
    const { error: deleteError } = await supabase.from("datasets").delete().eq("id", dataset.id);
    if (deleteError) {
      toast.error("We couldn't remove this dataset.");
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Dataset removed.");
  };

  const missingTotal = columns.reduce((sum, column) => sum + column.missing, 0);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Dataset"
        description="Upload a CSV file. It is parsed in your browser; only a summary and preview are stored."
        actions={
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="size-4" />
              {uploading ? "Reading…" : dataset ? "Replace CSV" : "Upload CSV"}
            </Button>
            {dataset ? (
              <Button variant="ghost" onClick={removeDataset}>
                <Trash2 className="size-4" /> Remove
              </Button>
            ) : null}
          </div>
        }
      >
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

        {!dataset ? (
          <EmptyState
            icon={<Database className="size-5" />}
            title="No dataset yet"
            description="Upload a CSV with a header row to profile its columns and choose a prediction target."
          />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <Stat label="File" value={dataset.name} />
              <Stat label="Rows" value={dataset.row_count.toLocaleString()} />
              <Stat label="Columns" value={String(dataset.column_count)} />
              <Stat label="Missing values" value={missingTotal.toLocaleString()} />
            </div>

            <div className="max-w-sm space-y-1.5">
              <Label>Target column (what you want to predict)</Label>
              <Select value={dataset.target_column ?? ""} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.name} value={column.name}>
                      {column.name} · {column.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!dataset.target_column ? (
                <p className="text-xs text-muted-foreground">
                  Pick a target column to continue to preprocessing.
                </p>
              ) : null}
            </div>
          </div>
        )}
      </SectionCard>

      {dataset ? (
        <>
          <SectionCard title="Column summary" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Missing</TableHead>
                    <TableHead className="text-right">Unique</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Mean</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columns.map((column) => (
                    <TableRow key={column.name}>
                      <TableCell className="font-medium">
                        {column.name}
                        {column.name === dataset.target_column ? (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-primary">
                            target
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{column.type}</TableCell>
                      <TableCell className="text-right tabular-nums">{column.missing}</TableCell>
                      <TableCell className="text-right tabular-nums">{column.unique}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {column.min !== undefined ? column.min.toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {column.mean !== undefined ? column.mean.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {column.max !== undefined ? column.max.toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>

          <SectionCard
            title="Data preview"
            description="First rows of the uploaded file."
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.name}>{column.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell
                          key={column.name}
                          className="whitespace-nowrap text-muted-foreground"
                        >
                          {row[column.name] || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
