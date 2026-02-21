import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DropdownMenuItem,
  confirmModal,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import { Plus, Edit, Trash, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

type EmailTemplate = {
  id: number;
  name: string;
  description?: string | null;
  subject: string;
  is_active?: boolean | number;
  updated_at?: string;
  created_at?: string;
};

export default function EmailTemplatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const {
    data: templates,
    loading,
    pagination,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    handleFilter,
    params,
    refresh,
  } = usePaginatedApi<EmailTemplate>("/api/email-templates", {
    initialLimit: 10,
  });

  const handleDelete = async (template: EmailTemplate) => {
    const confirmed = await confirmModal({
      title: "Delete template",
      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      type: "danger",
    });

    if (!confirmed) return;

    try {
      await axios.delete(`/api/email-templates/${template.id}`);
      toast.success("Template deleted");
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete template");
    }
  };

  const tableFilters = useMemo(
    () => [
      {
        label: "Status",
        value: "is_active",
        type: "select" as const,
        options: [
          { label: "Active", value: "1" },
          { label: "Inactive", value: "0" },
        ],
        searchOnChanged: true,
      },
    ],
    [],
  );

  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};
    if (
      params.filters?.is_active !== undefined &&
      params.filters.is_active !== null
    ) {
      values.is_active = new Set(String(params.filters.is_active).split(","));
    }
    return values;
  }, [params.filters]);

  const handleFilterChange = (key: string, value: any) => {
    const nextFilters: any = { ...params.filters };
    if (value instanceof Set) {
      const selected = Array.from(value as Set<string>);
      if (selected.length > 0) {
        nextFilters[key] = selected.join(",");
      } else {
        delete nextFilters[key];
      }
    } else {
      if (value !== undefined && value !== null && value !== "") {
        nextFilters[key] = value;
      } else {
        delete nextFilters[key];
      }
    }
    handleFilter(nextFilters);
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        cell: (template: EmailTemplate) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{template.name}</span>
            {template.description && (
              <span className="text-xs text-gray-500">
                {template.description}
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Subject",
        cell: (template: EmailTemplate) => (
          <span
            className="text-sm text-gray-600 truncate max-w-[300px] block"
            title={template.subject}
          >
            {template.subject}
          </span>
        ),
      },
      {
        header: "Status",
        cell: (template: EmailTemplate) => (
          <Badge variant={template.is_active ? "subtle" : "outline"}>
            {template.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        header: "Updated",
        cell: (template: EmailTemplate) => (
          <span className="text-xs text-gray-500">
            {template.updated_at
              ? new Date(template.updated_at).toLocaleDateString()
              : "-"}
          </span>
        ),
      },
    ],
    [],
  );

  const tableActions = (template: EmailTemplate) => (
    <>
      <DropdownMenuItem
        onClick={() => navigate(`/email-templates/${template.id}`)}
      >
        <Edit className="mr-2 h-4 w-4" /> Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleDelete(template)}
        className="text-destructive"
      >
        <Trash className="mr-2 h-4 w-4" /> Delete
      </DropdownMenuItem>
    </>
  );

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Email Templates
          </h2>
          <p className="text-sm text-gray-600">
            Templates are available to administrators only.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to manage email templates.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Email Templates
          </h2>
          <p className="text-sm text-gray-500">
            Manage your email templates and layouts.
          </p>
        </div>
        <Button onClick={() => navigate("/email-templates/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <DataTable
            data={templates}
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
            onReset={() => handleFilter({})}
            actions={tableActions}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
