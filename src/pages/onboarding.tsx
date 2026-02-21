import { useMemo, useState } from "react";
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
  confirmModal,
  DropdownMenuItem,
  Avatar,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import type { User, Role } from "@/types";

const roleOptions: Role[] = ["admin", "support", "client"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [processingBatch, setProcessingBatch] = useState(false);

  const handleBatchAction = async (action: "approve" | "reject") => {
    if (selectedIds.length === 0) return;

    const confirmed = await confirmModal({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} selected users?`,
      message: `Are you sure you want to ${action} ${selectedIds.length} users?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      type: action === "approve" ? "success" : "danger",
    });

    if (!confirmed) return;

    setProcessingBatch(true);
    try {
      await Promise.all(
        selectedIds.map((id) => axios.post(`/api/users/${id}/${action}`)),
      );
      toast.success(action === "approve" ? "Users approved" : "Users rejected");
      setSelectedIds([]);
      refresh();
    } catch (error: any) {
      toast.error("Failed to update some users");
    } finally {
      setProcessingBatch(false);
    }
  };

  const {
    data: pendingUsers,
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
    initialFilters: { is_approved: "false", is_rejected: "false" },
  });

  const handleAction = async (account: User, action: "approve" | "reject") => {
    const confirmed = await confirmModal({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} user?`,
      message: `Are you sure you want to ${action} ${account.display_name || account.username}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      type: action === "approve" ? "success" : "danger",
    });

    if (confirmed) {
      try {
        await axios.post(`/api/users/${account.id}/${action}`);
        toast.success(action === "approve" ? "User approved" : "User rejected");
        refresh();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Action failed");
      }
    }
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
        cell: () => <Badge variant="outline">Pending approval</Badge>,
      },
    ],
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
    ],
    [],
  );

  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};
    if (params.filters?.role) {
      values.role = new Set(String(params.filters.role).split(","));
    }
    return values;
  }, [params.filters]);

  const handleFilterChange = (key: string, value: any) => {
    const nextFilters: any = { ...params.filters };
    if (key === "role") {
      const selected = Array.from(value as Set<string>);
      nextFilters.role = selected.join(",");
      handleFilter(nextFilters);
    }
  };

  const tableActions = (account: User) => (
    <>
      <DropdownMenuItem onClick={() => handleAction(account, "approve")}>
        Approve
      </DropdownMenuItem>
      <DropdownMenuItem
        className="text-destructive"
        onClick={() => handleAction(account, "reject")}
      >
        Reject
      </DropdownMenuItem>
    </>
  );

  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Onboarding</h2>
          <p className="text-sm text-gray-600">
            Onboarding is managed by administrators.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to manage onboarding. Please contact an
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
          Onboarding
        </h2>
        <p className="text-sm text-gray-500">
          Approve new users before they can access the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && pendingUsers.length === 0 ? (
            <p className="text-sm text-gray-500">
              Loading onboarding requests...
            </p>
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
                      onClick={() => handleBatchAction("approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-2 bg-background text-destructive"
                      onClick={() => handleBatchAction("reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}
              <DataTable
                data={pendingUsers}
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
                onReset={() =>
                  handleFilter({ is_approved: "false", is_rejected: "false" })
                }
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
