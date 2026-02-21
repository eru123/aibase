import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Modal,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  confirmModal,
  DropdownMenuItem,
  Avatar,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import type { User, Role } from "@/types";

const roleOptions: Role[] = ["admin", "support", "client"];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending Approval", value: "pending_approval" },
];

export default function UsersPage() {
  const { user } = useAuth();
  const [savingId, setSavingId] = useState<number | string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("client");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [newRole, setNewRole] = useState<Role | "">("");
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

  const handleBatchAction = async (action: "activate" | "deactivate") => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirmModal({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} selected users?`,
      message: `Are you sure you want to ${action} ${selectedIds.length} users?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      type: action === "deactivate" ? "danger" : "info",
    });

    if (!confirmed) return;

    setSavingId("batch");
    try {
      await Promise.all(
        users
          .filter((u) => selectedIds.includes(u.id))
          .map((u) => {
            // Apply logic to only update if needed (e.g., skip if already active and action is activate)
            if (action === "activate" && u.is_active) return Promise.resolve();
            if (action === "deactivate" && !u.is_active)
              return Promise.resolve();
            return axios.put(`/api/users/${u.id}`, {
              is_active: action === "activate",
            });
          }),
      );
      toast.success(`Users ${action}d`);
      setSelectedIds([]);
      refresh();
    } catch (error: any) {
      toast.error("Failed to update some users");
    } finally {
      setSavingId(null);
    }
  };

  const {
    data: users,
    loading,
    pagination,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    handleFilter,
    params,
    refresh,
  } = usePaginatedApi<User>("/api/users", {
    initialLimit: 5,
  });

  const currentUserId = user?.id ? String(user.id) : null;

  const statusLabel = useMemo(
    () => (account: User) => {
      if (!account.is_active) {
        return { label: "Inactive", variant: "destructive" as const };
      }
      if (account.is_approved === false) {
        return { label: "Pending approval", variant: "outline" as const };
      }
      return { label: "Active", variant: "subtle" as const };
    },
    [],
  );

  const tableFilters = useMemo(
    () => [
      {
        label: "Role",
        value: "role",
        type: "select" as const,
        options: roleOptions.map((role) => ({
          label: role.charAt(0).toUpperCase() + role.slice(1),
          value: role,
        })),
        searchOnChanged: true,
      },
      {
        label: "Status",
        value: "status",
        type: "select" as const,
        options: statusOptions,
        searchOnChanged: true,
      },
    ],
    [],
  );

  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};

    if (params.filters?.role) {
      values.role = new Set(String(params.filters.role).split(","));
    }

    if (
      params.filters?.is_active !== undefined ||
      params.filters?.is_approved !== undefined
    ) {
      const selected = new Set<string>();
      if (params.filters.is_active === "true") selected.add("active");
      if (params.filters.is_active === "false") selected.add("inactive");
      if (params.filters.is_approved === "false")
        selected.add("pending_approval");
      if (selected.size > 0) values.status = selected;
    }

    return values;
  }, [params.filters]);

  const handleFilterChange = (key: string, value: any) => {
    const nextFilters: any = { ...params.filters };

    if (key === "role") {
      const selected = Array.from(value as Set<string>);
      nextFilters.role = selected.join(",");
      handleFilter(nextFilters);
    } else if (key === "status") {
      const selected = value as Set<string>;
      // Clear previous status related filters
      delete nextFilters.is_active;
      delete nextFilters.is_approved;
      delete nextFilters.is_rejected;

      if (selected.has("active")) nextFilters.is_active = "true";
      if (selected.has("inactive")) nextFilters.is_active = "false";
      if (selected.has("pending_approval")) {
        nextFilters.is_approved = "false";
        nextFilters.is_rejected = "false";
      }
      handleFilter(nextFilters);
    }
  };

  const handleBatchFilterChange = (updates: Record<string, any>) => {
    const nextFilters: any = { ...params.filters };

    Object.entries(updates).forEach(([key, value]) => {
      if (key === "role") {
        const selected = Array.from(value as Set<string>);
        nextFilters.role = selected.join(",");
      } else if (key === "status") {
        const selected = value as Set<string>;
        delete nextFilters.is_active;
        delete nextFilters.is_approved;
        delete nextFilters.is_rejected;

        if (selected.has("active")) nextFilters.is_active = "true";
        if (selected.has("inactive")) nextFilters.is_active = "false";
        if (selected.has("pending_approval")) {
          nextFilters.is_approved = "false";
          nextFilters.is_rejected = "false";
        }
      } else {
        nextFilters[key] = value;
      }
    });

    handleFilter(nextFilters);
  };

  const columns = useMemo(
    () => [
      {
        header: "User",
        cell: (account: User) => (
          <div className="flex items-center gap-3">
            <Avatar
              src={account.avatar_url}
              fallback={account.display_name || account.username}
              size="sm"
            />
            <div>
              <Link
                to={`/u/${account.username}`}
                className="font-medium text-gray-900 hover:text-primary transition-colors"
              >
                {account.display_name || account.username}
              </Link>
              <div className="text-xs text-gray-500">
                <Link to={`/u/${account.username}`} className="hover:underline">
                  {account.email}
                </Link>
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Role",
        cell: (account: User) => (
          <Badge variant="outline" className="capitalize">
            {account.role}
          </Badge>
        ),
      },
      {
        header: "Status",
        cell: (account: User) => {
          const status = statusLabel(account);
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
    ],
    [statusLabel],
  );

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return;
    setUpdatingRole(true);
    try {
      await axios.put(`/api/users/${editingUser.id}`, { role: newRole });
      toast.success("User role updated");
      setIsEditRoleModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleStatus = async (account: User) => {
    const action = account.is_active ? "deactivate" : "activate";
    const payload = { is_active: !account.is_active };

    const confirmed = await confirmModal({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} user?`,
      message: `Are you sure you want to ${action} ${account.username}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      type: account.is_active ? "danger" : "info",
    });

    if (confirmed) {
      try {
        await axios.put(`/api/users/${account.id}`, payload);
        toast.success(`User ${action}d`);
        refresh();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || `Failed to ${action} user`,
        );
      }
    }
  };

  const handleApproveReject = async (account: User, approve: boolean) => {
    const action = approve ? "approve" : "reject";
    const endpoint = `/api/users/${account.id}/${action}`;

    const confirmed = await confirmModal({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} user?`,
      message: `Are you sure you want to ${action} ${account.username}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      type: approve ? "success" : "danger",
    });

    if (confirmed) {
      try {
        await axios.post(endpoint);
        toast.success(`User ${action}ed`);
        refresh();
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || `Failed to ${action} user`,
        );
      }
    }
  };

  const tableActions = (account: User) => {
    const isSelf = currentUserId === String(account.id);
    return (
      <>
        <DropdownMenuItem
          onClick={() => {
            setEditingUser(account);
            setNewRole(account.role);
            setIsEditRoleModalOpen(true);
          }}
          disabled={savingId === account.id || isSelf}
        >
          Edit Role
        </DropdownMenuItem>

        {account.is_approved === false && !account.is_rejected && (
          <>
            <DropdownMenuItem
              onClick={() => handleApproveReject(account, true)}
            >
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleApproveReject(account, false)}
            >
              Reject
            </DropdownMenuItem>
          </>
        )}

        {!isSelf && account.is_approved !== false && (
          <DropdownMenuItem
            className={account.is_active ? "text-destructive" : "text-primary"}
            onClick={() => handleToggleStatus(account)}
            disabled={savingId === account.id}
          >
            {account.is_active ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        )}
      </>
    );
  };

  const normalizeInviteEmails = (rawValue: string) => {
    const entries = rawValue
      .split(/\r?\n/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(entries));
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInvite = async () => {
    const emails = normalizeInviteEmails(inviteEmail);
    if (emails.length === 0) {
      toast.error("At least one email is required");
      return;
    }
    const invalidEmails = emails.filter((email) => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      toast.error(
        `Invalid email address${invalidEmails.length > 1 ? "es" : ""}: ${invalidEmails.join(", ")}`,
      );
      return;
    }
    setInviteSending(true);
    try {
      const results = await Promise.allSettled(
        emails.map((email) =>
          axios.post("/api/auth/invite", {
            email,
            role: inviteRole,
          }),
        ),
      );
      const successful = results.filter(
        (result) => result.status === "fulfilled",
      );
      const failed = results.filter((result) => result.status === "rejected");
      const emailSentCount = successful.filter(
        (result) =>
          result.status === "fulfilled" && result.value.data?.email_sent,
      ).length;

      if (failed.length > 0) {
        const firstFailure = failed[0];
        const message =
          firstFailure.status === "rejected"
            ? (firstFailure.reason as any)?.response?.data?.message ||
              "Failed to send some invitations"
            : "Failed to send some invitations";
        toast.error(message);
      }

      if (successful.length > 0) {
        const summary = `Invitations created for ${successful.length}/${emails.length} ${
          emails.length === 1 ? "user" : "users"
        }.${emailSentCount > 0 ? ` Emails sent to ${emailSentCount}.` : ""}`;
        toast.success(summary);
      }

      if (failed.length === 0) {
        setInviteEmail("");
        setInviteRole("client");
        setInviteModalOpen(false);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to send invitations",
      );
    } finally {
      setInviteSending(false);
    }
  };

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Users</h2>
          <p className="text-sm text-gray-600">
            User administration is managed by administrators.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to manage users. Please contact an
              administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Users
        </h2>
        <p className="text-sm text-gray-500">
          Manage roles, access, and invitations.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Invite users</CardTitle>
            <p className="text-sm text-gray-600">
              Send invitations to one or more users.
            </p>
          </div>
          <Button onClick={() => setInviteModalOpen(true)}>Invite</Button>
        </CardHeader>
      </Card>

      <Modal
        show={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        sm
        closeOnOverlayClick={false}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleInvite();
          }}
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Invite users
            </h3>
            <p className="text-sm text-gray-600">
              Enter one email per line. All invitations will use the selected
              role.
            </p>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="inviteEmails"
              className="text-sm font-medium text-gray-700"
            >
              Email addresses
            </label>
            <Textarea
              id="inviteEmails"
              rows={3}
              placeholder="person@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              className="resize-y"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="inviteRole"
              className="text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <Select
              value={inviteRole}
              onValueChange={(value) => setInviteRole(value as Role)}
            >
              <SelectTrigger id="inviteRole">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteSending}>
              {inviteSending ? "Sending..." : "Send invite"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        show={isEditRoleModalOpen}
        onClose={() => setIsEditRoleModalOpen(false)}
        sm
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Edit User Role
            </h3>
            <p className="text-sm text-gray-600">
              Update the role for <strong>{editingUser?.username}</strong>.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value as Role)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updatingRole || !newRole}
            >
              {updatingRole ? "Updating..." : "Save changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <p className="text-sm text-gray-500">Loading users...</p>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-gray-600 mb-4">
                  <span className="font-medium text-gray-900">
                    {selectedIds.length}
                  </span>
                  <span>selected</span>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-2 bg-background"
                      onClick={() => handleBatchAction("activate")}
                      disabled={!!savingId}
                    >
                      Activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-2 bg-background text-destructive"
                      onClick={() => handleBatchAction("deactivate")}
                      disabled={!!savingId}
                    >
                      Deactivate
                    </Button>
                  </div>
                </div>
              )}
              <DataTable
                data={users}
                columns={columns}
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                onPageChange={handlePageChange}
                onPageSizeChange={handleLimitChange}
                searchKey="search"
                searchValue={params.search}
                onSearchChange={handleSearch}
                filters={tableFilters}
                filterValues={filterValues}
                onFilterChange={handleFilterChange}
                onBatchFilterChange={handleBatchFilterChange}
                onReset={() => handleFilter({})}
                actions={tableActions}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
