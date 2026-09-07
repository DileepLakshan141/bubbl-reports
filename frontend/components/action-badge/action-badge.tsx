import { Badge } from "../ui/badge";

export const ActionBadge = ({ action }: { action: string }) => {
  switch (action) {
    case "approved":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-approved)] bg-[var(--status-approved-bg)] border-transparent"
        >
          approved
        </Badge>
      );
    case "submitted":
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-submitted)] bg-[var(--status-submitted-bg)] border-transparent"
        >
          reviewed
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="text-[var(--status-correction)] bg-[var(--status-correction-bg)] border-transparent"
        >
          requested changes on
        </Badge>
      );
  }
};
