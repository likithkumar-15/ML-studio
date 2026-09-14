import { cn } from "@/lib/utils";

export function ConfusionMatrix({ labels, matrix }: { labels: string[]; matrix: number[][] }) {
  const max = Math.max(1, ...matrix.flat());

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">
              Actual ↓ / Predicted →
            </th>
            {labels.map((label) => (
              <th key={label} className="px-2 py-1 text-xs font-medium text-muted-foreground">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={labels[i] ?? i}>
              <th className="px-2 py-1 text-left text-xs font-medium text-muted-foreground">
                {labels[i] ?? `class_${i}`}
              </th>
              {row.map((value, j) => (
                <td key={j} className="p-0">
                  <div
                    className={cn(
                      "flex size-16 items-center justify-center rounded-md text-sm font-semibold tabular-nums",
                      i === j ? "text-primary-foreground" : "text-foreground",
                    )}
                    style={{
                      backgroundColor:
                        i === j
                          ? `color-mix(in oklab, var(--primary) ${35 + (value / max) * 65}%, var(--card))`
                          : `color-mix(in oklab, var(--muted) ${25 + (value / max) * 75}%, var(--card))`,
                    }}
                  >
                    {value}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
