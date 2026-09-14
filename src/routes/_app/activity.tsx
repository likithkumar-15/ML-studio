import { createFileRoute } from "@tanstack/react-router";
import { Activity as ActivityIcon } from "lucide-react";

import { EmptyState, LoadingRows, PageHeader, SectionCard, StatusPill } from "@/components/common";
import { useActivity } from "@/lib/queries";
import { formatDateTime } from "@/lib/workflow";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Activity — ML Studio" },
      {
        name: "description",
        content: "A record of everything that happened across your ML projects.",
      },
      { property: "og:title", content: "Activity — ML Studio" },
      {
        property: "og:description",
        content: "A record of everything that happened across your ML projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const activity = useActivity(200);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="A running record of the work in your workspace." />

      <SectionCard bodyClassName="p-0">
        {activity.isLoading ? (
          <div className="p-5">
            <LoadingRows rows={5} />
          </div>
        ) : (activity.data ?? []).length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<ActivityIcon className="size-5" />}
              title="No activity yet"
              description="Create a project and your actions will start appearing here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(activity.data ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-medium">{item.action}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {item.project_name ?? "Workspace"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
