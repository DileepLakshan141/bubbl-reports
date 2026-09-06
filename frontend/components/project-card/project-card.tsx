import { Eye, Pencil, Trash2, Calendar, ScanSearch, Flag } from "lucide-react";
import { Button } from "../ui/button";
import { ProjectCardProps } from "../../lib/types/project.types";

const DESCRIPTION_LIMIT = 110;

function truncate(text: string, limit: number) {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + "...";
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

const ProjectCard = (props: ProjectCardProps) => {
  const {
    name,
    description,
    createdAt,
    onUpdate,
    onDelete,
    onView,
    onReview,
    isActive,
  } = props;

  return (
    <div className="flex h-[340px] w-72 flex-col justify-between overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      {/* Top Section: Cover Image & Status Badge */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-muted">
        <img
          className="h-full w-full object-cover"
          src={`https://api.dicebear.com/10.x/triangles/svg?seed=${name}`}
          alt="project_cover_img"
        />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize shadow-sm ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {isActive ? "Active" : "Archived"}
        </span>
      </div>

      {/* Middle Section: Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-bold">{name}</h3>
        <p
          className="mt-2 line-clamp-3 w-full text-xs leading-relaxed text-gray-500 dark:text-gray-400"
          title={description}
        >
          {truncate(description, DESCRIPTION_LIMIT)}
        </p>
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Created {formatDate(createdAt)}</span>
        </div>
      </div>

      {/* Bottom Section: Action Buttons */}
      <div className="w-full flex items-center justify-center gap-1.5 border-t bg-muted/20 px-4 py-2.5">
        <Button variant="outline" size="icon" onClick={onView} title="View">
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onReview}
          title="Team Reports"
        >
          <Flag className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onUpdate} title="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          title="Delete"
          className="hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProjectCard;
