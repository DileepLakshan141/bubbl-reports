/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { projectSchema, ProjectFormValues } from "@/schemas/project.schema";
import { findProjectById, updateProject } from "@/lib/services/project";

interface UpdateProjectDialogProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const UpdateProjectDialog = ({
  projectId,
  open,
  onOpenChange,
  onUpdated,
}: UpdateProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setServerError(null);

    findProjectById(projectId).then((result) => {
      if (cancelled) return;
      setLoading(false);

      if (!result.success) {
        setServerError(result.message);
        return;
      }

      reset({
        name: result.project.name,
        description: result.project.description,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [open, projectId, reset]);

  const onSubmit = async (values: ProjectFormValues) => {
    setSubmitting(true);
    setServerError(null);

    const result = await updateProject(projectId, values);

    setSubmitting(false);

    if (!result.success) {
      setServerError(result.message);
      return;
    }

    onOpenChange(false);
    onUpdated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="mb-3">
            <DialogTitle className="text-lg font-semibold">
              Edit project
            </DialogTitle>
            <DialogDescription>
              Update the project&apos;s name or description.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="text-sm text-muted-foreground py-6">
              Loading project details...
            </p>
          ) : (
            <FieldGroup>
              <Field>
                <Label htmlFor="edit-name">Project name</Label>
                <Input id="edit-name" {...register("name")} />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <Field>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <FieldError>{errors.description.message}</FieldError>
                )}
              </Field>

              {serverError && <FieldError>{serverError}</FieldError>}
            </FieldGroup>
          )}

          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProjectDialog;
