/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { findUsersPaginated, updateUserRole } from "@/lib/services/user";
import { findAllProjects } from "@/lib/services/project";
import { Role, User } from "@/lib/types/auth.types";
import { Project } from "@/lib/types/project.types";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "../../ui/avatar";

const ROLE_OPTIONS: Role[] = ["TEAM_MEMBER", "MANAGER", "ADMIN"];

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    findAllProjects().then((result) => {
      if (result.success) setProjects(result.projects);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    findUsersPaginated({
      search: debouncedSearch || undefined,
      projectId: projectFilter !== "all" ? Number(projectFilter) : undefined,
      page,
      limit: 10,
    }).then((result) => {
      setLoading(false);
      if (result.success) {
        setUsers(result.users);
        setTotalPages(result.totalPages);
      }
    });
  }, [debouncedSearch, projectFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, projectFilter]);

  const handleRoleChange = async (userId: number, role: Role) => {
    setUpdatingId(userId);
    const previous = users.find((u) => u.id === userId)?.role;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));

    const result = await updateUserRole(userId, role);
    setUpdatingId(null);

    if (!result.success) {
      toast.error(result.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: previous! } : u)),
      );
      return;
    }
    toast.success(`${result.user.username}'s role updated to ${role}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
      <h1 className="text-2xl capitalize font-semibold mb-6">Manage users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          placeholder="Search by email or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          value={projectFilter}
          onValueChange={(val) => setProjectFilter(val ?? "all")}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary font-semibold pl-5">
                Username
              </TableHead>
              <TableHead className="text-primary font-semibold pl-5">
                Email
              </TableHead>
              <TableHead className="w-44 text-primary font-semibold pl-5">
                Role
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Spinner className="size-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-xs text-muted-foreground py-8"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex justify-start items-center gap-2.5">
                      <Avatar size="default">
                        <AvatarImage
                          src={`https://api.dicebear.com/10.x/loops/svg?seed=${u.username}`}
                          alt={u.username ?? "User"}
                        />
                        <AvatarFallback>
                          {u.username?.charAt(0).toUpperCase() ?? "U"}
                        </AvatarFallback>
                        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                      </Avatar>
                      <span>{u.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(role) => {
                        if (role) {
                          handleRoleChange(u.id, role as Role);
                        }
                      }}
                      disabled={updatingId === u.id}
                    >
                      <SelectTrigger className="w-full">
                        {updatingId === u.id ? (
                          <Spinner className="size-4" />
                        ) : (
                          <SelectValue />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default UserManagement;
