/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { ReactElement, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { assignEmployee, removeEmployee } from "@/lib/services/project";
import { searchUsersByEmail } from "@/lib/services/user";
import { AssignedMember } from "@/lib/types/project.types";
import { User } from "@/lib/types/auth.types";
import { toast } from "sonner";

interface TeamManagementDialogProps {
  projectId: number;
  members?: AssignedMember[];
  onChanged?: () => void;
  trigger?: ReactElement;
}

const TeamManagementDialog = ({
  projectId,
  members = [],
  onChanged,
  trigger,
}: TeamManagementDialogProps) => {
  const [open, setOpen] = useState(false);
  const [emailQuery, setEmailQuery] = useState("");
  const debouncedEmail = useDebouncedValue(emailQuery, 400);
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const assignedIds = new Set(members.map((m) => m.userId));

  useEffect(() => {
    if (!debouncedEmail) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchUsersByEmail(debouncedEmail).then((result) => {
      setSearching(false);
      if (result && result.success) setResults(result.users);
    });
  }, [debouncedEmail]);

  const handleAssign = async (userId: number) => {
    setBusyId(userId);
    const result = await assignEmployee(projectId, userId);
    setBusyId(null);
    if (!result || !result.success) {
      const errorMessage =
        result && "message" in result && typeof result.message === "string"
          ? result.message
          : "Failed to assign member";

      toast.error(errorMessage);
      return;
    }
    toast.success("Member assigned");
    onChanged?.();
  };

  const handleRemove = async (userId: number) => {
    setBusyId(userId);
    const result = await removeEmployee(projectId, userId);
    setBusyId(null);
    if (!result || !result.success) {
      const errorMessage =
        result && "message" in result && typeof result.message === "string"
          ? result.message
          : "Failed to assign member";

      toast.error(errorMessage);
      return;
    }
    toast.success("Member removed");
    onChanged?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Team
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1">
              Members ({members.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="flex-1">
              Search & assign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="pt-4">
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={`https://api.dicebear.com/10.x/avataaars/svg?seed=${m.user.username}`}
                      className="w-8 h-8 rounded-full shrink-0"
                      alt=""
                    />
                    <span className="text-sm truncate">{m.user.username}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === m.userId}
                    onClick={() => handleRemove(m.userId)}
                  >
                    {busyId === m.userId ? (
                      <Spinner className="size-4" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No members yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="add" className="pt-4">
            <Input
              placeholder="Search by email..."
              value={emailQuery}
              onChange={(e) => setEmailQuery(e.target.value)}
              className="mb-3"
            />
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {searching && (
                <div className="flex justify-center py-4">
                  <Spinner className="size-5" />
                </div>
              )}
              {!searching &&
                results.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{u.username}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={assignedIds.has(u.id) || busyId === u.id}
                      onClick={() => handleAssign(u.id)}
                    >
                      {busyId === u.id ? (
                        <Spinner className="size-4" />
                      ) : assignedIds.has(u.id) ? (
                        "Assigned"
                      ) : (
                        "Assign"
                      )}
                    </Button>
                  </div>
                ))}
              {!searching && debouncedEmail && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No users found.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagementDialog;
