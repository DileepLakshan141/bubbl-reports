import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Star } from "lucide-react";
import { ReportVersion } from "../../../lib/types/report.type";

interface ReportContentProps {
  version: ReportVersion;
  creatorName?: string;
}

const ReportContent = ({ version, creatorName }: ReportContentProps) => {
  const tasks = version.tasks.filter((t) => !t.isFutureTask);
  const futureTasks = version.tasks.filter((t) => t.isFutureTask);

  return (
    <div>
      {creatorName && (
        <p className="text-xs text-muted-foreground mb-6">
          Filed by {creatorName}
        </p>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Tasks</h2>
        <div className="rounded-lg border overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Planned %</TableHead>
                <TableHead>Actual %</TableHead>
                <TableHead>Time (planned/spent)</TableHead>
                <TableHead>Output</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell>{t.plannedProgress}%</TableCell>
                  <TableCell>{t.actualProgress}%</TableCell>
                  <TableCell>
                    {t.timeSpent}h / {t.timePlanned}h
                  </TableCell>
                  <TableCell>{t.output || "—"}</TableCell>
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-xs text-muted-foreground py-6"
                  >
                    No tasks recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Planned for next week</h2>
        <div className="rounded-lg border overflow-x-auto">
          <Table className="min-w-[480px]">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Planned (h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {futureTasks.map((t, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.timePlanned}h</TableCell>
                </TableRow>
              ))}
              {futureTasks.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-xs text-muted-foreground py-6"
                  >
                    Nothing planned.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {version.blockers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Blockers</h2>
          <div className="flex flex-col gap-2">
            {version.blockers.map((b, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 flex items-center gap-2 text-sm"
              >
                {b.isKeyIssue && (
                  <Star className="h-4 w-4 fill-current shrink-0" />
                )}
                <span>{b.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {version.achievements.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3">Achievements</h2>
          <div className="flex flex-col gap-2">
            {version.achievements.map((a, i) => (
              <div
                key={i}
                className="rounded-lg border p-3 flex items-center gap-2 text-sm"
              >
                {a.isKeyAchievement && (
                  <Star className="h-4 w-4 fill-current shrink-0" />
                )}
                <span>{a.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ReportContent;
