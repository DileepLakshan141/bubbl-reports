"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Star, CalendarIcon, OctagonX } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Item, ItemContent, ItemActions } from "@/components/ui/item";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { getReport, saveDraft, submitReport } from "@/lib/services/report";
import {
  reportEditorSchema,
  ReportEditorValues,
} from "@/schemas/report.schema";
import {
  PRIORITY_OPTIONS,
  TASK_TYPE_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/constants/task-options";
import EmptyTemplate from "../../empty-template/empty-template";

interface ReportEditorProps {
  reportId: number;
}

const emptyTask = {
  name: "",
  priority: PRIORITY_OPTIONS[0] ?? "MEDIUM",
  type: TASK_TYPE_OPTIONS[0] ?? "DEVELOPMENT",
  status: TASK_STATUS_OPTIONS[0] ?? "NOT_STARTED",
  plannedProgress: 0,
  actualProgress: 0,
  timePlanned: 0,
  timeSpent: 0,
  output: "",
  isFutureTask: false,
};

const emptyFutureTask = { ...emptyTask, isFutureTask: true };

const toastStyle = {
  success: { style: { borderLeft: "4px solid #16a34a" } },
  error: { style: { borderLeft: "4px solid #dc2626" } },
};

const ReportEditor = ({ reportId }: ReportEditorProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState<string | null>(null);

  const [lockedStartDate, setLockedStartDate] = useState<Date | undefined>();
  const [lockedEndDate, setLockedEndDate] = useState<Date | undefined>();

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportEditorValues>({
    resolver: zodResolver(reportEditorSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      tasks: [],
      futureTasks: [],
      blockers: [],
      achievements: [],
      notes: "",
    },
  });

  const taskFields = useFieldArray({ control, name: "tasks" });
  const futureTaskFields = useFieldArray({ control, name: "futureTasks" });
  const blockerFields = useFieldArray({ control, name: "blockers" });
  const achievementFields = useFieldArray({ control, name: "achievements" });

  const blockers = watch("blockers") ?? [];
  const achievements = watch("achievements") ?? [];

  const preventInvalidIntegerKeys = (e: KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    let cancelled = false;

    getReport(reportId).then((result) => {
      if (cancelled) return;
      setLoading(false);

      if (!result.success) {
        const errorMessage =
          "message" in result ? result.message : "Action failed";
        toast.error(errorMessage, toastStyle.error);
        return;
      }

      const { report } = result;
      setReportStatus(report.status);

      const cleanStartDate = report.startDate.slice(0, 10);
      const cleanEndDate = report.endDate.slice(0, 10);
      setLockedStartDate(parseISO(cleanStartDate));
      setLockedEndDate(parseISO(cleanEndDate));

      if (report.status === "NEEDS_CORRECTION" && report.currentVersion) {
        const lastComment = report.currentVersion.comments?.at(-1);
        setRejectionComment(lastComment?.comment ?? null);
      }

      const allTasks = report.currentVersion?.tasks ?? [];

      reset({
        name: report.name,
        startDate: cleanStartDate,
        endDate: cleanEndDate,
        tasks: allTasks.filter((t) => !t.isFutureTask),
        futureTasks: allTasks.filter((t) => t.isFutureTask),
        blockers: report.currentVersion?.blockers ?? [],
        achievements: report.currentVersion?.achievements ?? [],
        notes: report.currentVersion?.notes?.[0]?.content ?? "",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [reportId, reset]);

  const canEdit =
    reportStatus === "DRAFT" || reportStatus === "NEEDS_CORRECTION";

  const markKeyBlocker = (index: number) => {
    const isAlreadyKey = blockers[index]?.isKeyIssue;
    blockers.forEach((_, i) =>
      setValue(`blockers.${i}.isKeyIssue`, isAlreadyKey ? false : i === index),
    );
  };

  const markKeyAchievement = (index: number) => {
    const isAlreadyKey = achievements[index]?.isKeyAchievement;
    achievements.forEach((_, i) =>
      setValue(
        `achievements.${i}.isKeyAchievement`,
        isAlreadyKey ? false : i === index,
      ),
    );
  };

  const combinedTasksPayload = (values: ReportEditorValues) => [
    ...values.tasks.map((t) => ({ ...t, isFutureTask: false })),
    ...values.futureTasks.map((t) => ({
      ...t,
      isFutureTask: true,
      actualProgress: 0,
      timeSpent: 0,
    })),
  ];

  const handleSave = async () => {
    setSaving(true);
    const values = getValues();

    const result = await saveDraft(reportId, {
      ...values,
      tasks: combinedTasksPayload(values),
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.message, toastStyle.error);
      return;
    }
    toast.success("Progress saved", toastStyle.success);
  };

  const onSubmitReport = async (values: ReportEditorValues) => {
    const allTasks = combinedTasksPayload(values);
    if (!allTasks.length) {
      toast.error("Add at least one task before submitting.", toastStyle.error);
      return;
    }

    setSubmitting(true);
    const result = await submitReport(reportId, { ...values, tasks: allTasks });
    setSubmitting(false);

    if (!result.success) {
      const errorMessage =
        "message" in result ? result.message : "Action failed";
      toast.error(errorMessage, toastStyle.error);
      return;
    }

    toast.success("Report submitted", toastStyle.success);
    router.push(`/dashboard/assigned-projects`);
  };

  const onError = (formErrors: FieldErrors<ReportEditorValues>) => {
    console.error("Form Validation Errors:", formErrors);
    toast.error(
      "Please fill in all required fields properly.",
      toastStyle.error,
    );
  };

  if (loading) {
    return (
      <div className="w-full h-60 flex justify-center items-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <EmptyTemplate
          icon={OctagonX}
          title="Report is no longer editable!"
          description="This report is already submitted for the review of the project manager. You cannot edit it until your manager changes the status."
          tailwindHeight="h-30"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 pb-28">
      <h1 className="text-2xl font-semibold mb-1">Weekly report</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Fill in your tasks, blockers, and achievements for this week.
      </p>

      {rejectionComment && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm mb-6">
          <p className="font-medium">Sent back for correction</p>
          <p className="mt-1">{rejectionComment}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmitReport, onError)}>
        {/* Report meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="name">Report name</FieldLabel>
            <Input id="name" {...register("name")} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Start date</FieldLabel>
            <Popover>
              <PopoverTrigger>
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md w-full justify-start text-left font-normal select-none cursor-pointer">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lockedStartDate ? format(lockedStartDate, "PPP") : "—"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={lockedStartDate} disabled />
              </PopoverContent>
            </Popover>
          </Field>

          <Field>
            <FieldLabel>End date</FieldLabel>
            <Popover>
              <PopoverTrigger>
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md w-full justify-start text-left font-normal select-none cursor-pointer">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lockedEndDate ? format(lockedEndDate, "PPP") : "—"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={lockedEndDate} disabled />
              </PopoverContent>
            </Popover>
          </Field>
        </div>

        <Separator className="mb-6" />

        {/* Current week tasks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold capitalize text-primary">
              This week&apos;s tasks
            </h2>
            <Button
              type="button"
              className="w-50 bg-destructive text-pretty capitalize font-semibold"
              size="sm"
              onClick={() => taskFields.append(emptyTask)}
            >
              <Plus className="mr-1 h-3 w-3" /> Add task
            </Button>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Task</TableHead>
                  <TableHead className="w-32">Priority</TableHead>
                  <TableHead className="w-40">Type</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                  <TableHead className="w-24">Planned %</TableHead>
                  <TableHead className="w-24">Actual %</TableHead>
                  <TableHead className="w-28">Planned (h)</TableHead>
                  <TableHead className="w-28">Spent (h)</TableHead>
                  <TableHead className="min-w-[160px]">Output</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskFields.fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        {...register(`tasks.${index}.name`)}
                        placeholder="Task name"
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`tasks.${index}.priority`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((val) => (
                                <SelectItem key={val} value={val}>
                                  {val}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`tasks.${index}.type`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_TYPE_OPTIONS.map((val) => (
                                <SelectItem key={val} value={val}>
                                  {val}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`tasks.${index}.status`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_STATUS_OPTIONS.map((val) => (
                                <SelectItem key={val} value={val}>
                                  {val}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        onKeyDown={preventInvalidIntegerKeys}
                        {...register(`tasks.${index}.plannedProgress`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        onKeyDown={preventInvalidIntegerKeys}
                        {...register(`tasks.${index}.actualProgress`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        onKeyDown={preventInvalidIntegerKeys}
                        {...register(`tasks.${index}.timePlanned`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        onKeyDown={preventInvalidIntegerKeys}
                        {...register(`tasks.${index}.timeSpent`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        {...register(`tasks.${index}.output`)}
                        placeholder="Optional"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => taskFields.remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {taskFields.fields.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-xs text-muted-foreground py-6"
                    >
                      No tasks added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Future tasks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold capitalize text-primary">
              Planned for next week
            </h2>
            <Button
              type="button"
              className="w-50 bg-destructive text-pretty capitalize font-semibold"
              size="sm"
              onClick={() => futureTaskFields.append(emptyFutureTask)}
            >
              <Plus className="mr-1 h-3 w-3" /> Add future task
            </Button>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Task</TableHead>
                  <TableHead className="w-32">Priority</TableHead>
                  <TableHead className="w-40">Type</TableHead>
                  <TableHead className="w-28">Planned (h)</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureTaskFields.fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        {...register(`futureTasks.${index}.name`)}
                        placeholder="Task name"
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`futureTasks.${index}.priority`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Controller
                        control={control}
                        name={`futureTasks.${index}.type`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        onKeyDown={preventInvalidIntegerKeys}
                        {...register(`futureTasks.${index}.timePlanned`, {
                          valueAsNumber: true,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => futureTaskFields.remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {futureTaskFields.fields.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-muted-foreground py-6"
                    >
                      Nothing planned yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Blockers */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold capitalize text-primary">
              Blockers
            </h2>
            <Button
              type="button"
              className="w-50 bg-destructive text-pretty capitalize font-semibold"
              size="sm"
              onClick={() =>
                blockerFields.append({ name: "", isKeyIssue: false })
              }
            >
              <Plus className="mr-1 h-3 w-3" /> Add blocker
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {blockerFields.fields.map((field, index) => (
              <Item
                key={field.id}
                variant="outline"
                className="flex-wrap sm:flex-nowrap"
              >
                <ItemContent className="min-w-0 flex-1">
                  <Input
                    {...register(`blockers.${index}.name`)}
                    placeholder="Describe the blocker"
                  />
                </ItemContent>
                <ItemActions>
                  <Button
                    type="button"
                    variant={blockers[index]?.isKeyIssue ? "default" : "ghost"}
                    size="icon"
                    title="Mark as key issue"
                    onClick={() => markKeyBlocker(index)}
                  >
                    <Star
                      className={`h-4 w-4 ${blockers[index]?.isKeyIssue ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => blockerFields.remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold capitalize text-primary">
              Achievements
            </h2>
            <Button
              type="button"
              className="w-50 bg-destructive text-pretty capitalize font-semibold"
              size="sm"
              onClick={() =>
                achievementFields.append({ name: "", isKeyAchievement: false })
              }
            >
              <Plus className="mr-1 h-3 w-3" /> Add achievement
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {achievementFields.fields.map((field, index) => (
              <Item
                key={field.id}
                variant="outline"
                className="flex-wrap sm:flex-nowrap"
              >
                <ItemContent className="min-w-0 flex-1">
                  <Input
                    {...register(`achievements.${index}.name`)}
                    placeholder="Describe the achievement"
                  />
                </ItemContent>
                <ItemActions>
                  <Button
                    type="button"
                    variant={
                      achievements[index]?.isKeyAchievement
                        ? "default"
                        : "ghost"
                    }
                    size="icon"
                    title="Mark as key achievement"
                    onClick={() => markKeyAchievement(index)}
                  >
                    <Star
                      className={`h-4 w-4 ${achievements[index]?.isKeyAchievement ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => achievementFields.remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </div>
        </div>

        <Field className="mb-6">
          <FieldLabel
            className="text-lg font-semibold capitalize text-primary"
            htmlFor="notes"
          >
            Notes (optional)
          </FieldLabel>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </Field>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 sm:p-4 flex flex-col sm:flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={saving || submitting}
            className="w-full sm:w-auto"
          >
            {saving && <Spinner className="mr-2 size-4" />}
            {saving ? "Saving..." : "Save progress"}
          </Button>

          <Button
            type="submit"
            disabled={saving || submitting}
            className="w-full sm:w-auto"
          >
            {submitting && <Spinner className="mr-2 size-4" />}
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportEditor;
