import type { ColumnProfile } from "./types";

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  columns: ColumnProfile[];
  previewRows: Record<string, string>[];
};

export class CsvError extends Error {}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}

const MISSING = new Set(["", "na", "n/a", "null", "nan", "none", "-", "?"]);

export function isMissing(value: string | undefined) {
  return value === undefined || MISSING.has(value.trim().toLowerCase());
}

export function profileColumns(headers: string[], rows: Record<string, string>[]): ColumnProfile[] {
  return headers.map((name) => {
    const values = rows.map((row) => row[name] ?? "");
    const present = values.filter((v) => !isMissing(v));
    const numericValues = present
      .map((v) => Number(v.replace(/[^0-9.eE+-]/g, "")))
      .filter((n) => Number.isFinite(n));
    const numericRatio = present.length ? numericValues.length / present.length : 0;
    const unique = new Set(present).size;
    const isNumeric = numericRatio > 0.85 && unique > 2;

    const profile: ColumnProfile = {
      name,
      type: isNumeric ? "numeric" : "categorical",
      missing: values.length - present.length,
      unique,
      sampleValues: Array.from(new Set(present)).slice(0, 8),
    };

    if (isNumeric && numericValues.length) {
      profile.min = Math.min(...numericValues);
      profile.max = Math.max(...numericValues);
      profile.mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    }
    return profile;
  });
}

export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!clean) throw new CsvError("This file looks empty. Please upload a CSV with data in it.");

  const lines = clean.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new CsvError("This CSV needs a header row and at least one row of data.");
  }

  const headers = splitLine(lines[0]!).map((h, i) => h || `column_${i + 1}`);
  if (headers.length < 2) {
    throw new CsvError("We couldn't find comma-separated columns. Please check the file format.");
  }

  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    rows.push(row);
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
    columns: profileColumns(headers, rows),
    previewRows: rows.slice(0, 20),
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
