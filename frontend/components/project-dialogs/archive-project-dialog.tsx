// components/projects/archive-project-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { updateProject } from "@/lib/services/project";

interface ArchiveProjectDialogProps {
  projectId: number;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchived?: () => void;
}

const ArchiveProjectDialog = ({
  projectId,
  projectName,
  open,
  onOpenChange,
  onArchived,
}: ArchiveProjectDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleArchive = async () => {
    setSubmitting(true);
    setServerError(null);

    const result = await updateProject(projectId, { isActive: false });

    setSubmitting(false);

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    onOpenChange(false);
    onArchived?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Archive project
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong>{projectName}</strong>? It
            will be marked inactive but its reports and history stay intact.
          </DialogDescription>
        </DialogHeader>

        {serverError && <FieldError>{serverError}</FieldError>}

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            variant="destructive"
            onClick={handleArchive}
            disabled={submitting}
          >
            {submitting ? "Archiving..." : "Archive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ArchiveProjectDialog;
