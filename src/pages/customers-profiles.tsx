import { useMemo, useState } from "react";
import axios from "axios";
import { goeyToast as toast } from "goey-toast";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  DataTable,
  DropdownMenuItem,
  confirmModal,
  Modal,
  Switch,
} from "@/components/ui";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import { Plus } from "lucide-react";

interface CustomerProfile {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  company_name?: string | null;
  phone?: string | null;
  email: string;
  is_active: number | boolean;
  created_at?: string;
}

export default function CustomersProfilesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    company_name: "",
    phone: "",
    email: "",
    is_active: 1,
  });
  const [saving, setSaving] = useState(false);

  const {
    data,
    loading,
    pagination,
    handlePageChange,
    handleLimitChange,
    handleSearch,
    handleFilter,
    params,
    refresh,
  } = usePaginatedApi<CustomerProfile>("/api/customers/profiles", {
    initialLimit: 10,
  });

  const tableFilters = useMemo(
    () => [
      {
        label: "Status",
        value: "status",
        type: "select" as const,
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
        searchOnChanged: true,
      },
    ],
    [],
  );

  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};

    if (params.filters?.is_active !== undefined) {
      const selected = new Set<string>();
      if (params.filters.is_active === "true") selected.add("active");
      if (params.filters.is_active === "false") selected.add("inactive");
      if (selected.size > 0) values.status = selected;
    }

    return values;
  }, [params.filters]);

  const handleFilterChange = (key: string, value: any) => {
    const nextFilters: any = { ...params.filters };

    if (key === "status") {
      const selected = value as Set<string>;
      delete nextFilters.is_active;

      if (selected.has("active")) nextFilters.is_active = "true";
      if (selected.has("inactive")) nextFilters.is_active = "false";
      handleFilter(nextFilters);
    }
  };

  const handleBatchFilterChange = (updates: Record<string, any>) => {
    const nextFilters: any = { ...params.filters };

    Object.entries(updates).forEach(([key, value]) => {
      if (key === "status") {
        const selected = value as Set<string>;
        delete nextFilters.is_active;

        if (selected.has("active")) nextFilters.is_active = "true";
        if (selected.has("inactive")) nextFilters.is_active = "false";
      } else {
        nextFilters[key] = value;
      }
    });

    handleFilter(nextFilters);
  };

  const openCreate = () => {
    setEditId(null);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      company_name: "",
      phone: "",
      email: "",
      is_active: 1,
    });
    setModalOpen(true);
  };

  const openEdit = (row: CustomerProfile) => {
    setEditId(row.id);
    setForm({
      first_name: row.first_name,
      middle_name: row.middle_name || "",
      last_name: row.last_name,
      company_name: row.company_name || "",
      phone: row.phone || "",
      email: row.email,
      is_active: row.is_active ? 1 : 0,
    });
    setModalOpen(true);
  };

  const saveProfile = async () => {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.email.trim()
    ) {
      toast.error("First name, last name, and email are required.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`/api/customers/profiles/${editId}`, form);
        toast.success("Customer profile updated");
      } else {
        await axios.post("/api/customers/profiles", form);
        toast.success("Customer added");
      }
      setModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const removeProfile = async (row: CustomerProfile) => {
    const combinedName = [row.first_name, row.last_name]
      .filter(Boolean)
      .join(" ");
    const confirmed = await confirmModal({
      title: "Delete customer",
      message: `Delete ${combinedName}?`,
      type: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;
    await axios.delete(`/api/customers/profiles/${row.id}`);
    toast.success("Customer removed");
    refresh();
  };

  const columns = useMemo(
    () => [
      {
        header: "Name",
        cell: (row: CustomerProfile) =>
          [row.first_name, row.middle_name, row.last_name]
            .filter(Boolean)
            .join(" "),
      },
      { header: "Company", accessorKey: "company_name" as const },
      { header: "Email", accessorKey: "email" as const },
      { header: "Phone", accessorKey: "phone" as const },
      {
        header: "Status",
        cell: (row: CustomerProfile) => (row.is_active ? "Active" : "Inactive"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Customer Profiles
          </h2>
          <p className="text-sm text-gray-500">
            Manage customer profiles and contact records.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <DataTable
            data={data}
            columns={columns}
            isLoading={loading}
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
            actions={(row: CustomerProfile) => (
              <>
                <DropdownMenuItem onClick={() => openEdit(row)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => removeProfile(row)}
                >
                  Delete
                </DropdownMenuItem>
              </>
            )}
          />
        </CardContent>
      </Card>

      <Modal show={modalOpen} onClose={() => !saving && setModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {editId ? "Edit Customer" : "Add Customer"}
            </h3>
            <p className="text-sm text-gray-600">
              Provide the customer's contact and billing information.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middle_name">Middle Name (Optional)</Label>
              <Input
                id="middle_name"
                value={form.middle_name}
                onChange={(e) =>
                  setForm({ ...form, middle_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name (Optional)</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(e) =>
                  setForm({ ...form, company_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 flex flex-col justify-center">
              <Label htmlFor="is_active">Active Status</Label>
              <div className="flex items-center space-x-2 pt-1">
                <Switch
                  id="is_active"
                  checked={form.is_active === 1}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_active: checked ? 1 : 0 })
                  }
                />
                <Label
                  htmlFor="is_active"
                  className="cursor-pointer font-normal text-muted-foreground"
                >
                  {form.is_active === 1 ? "Active profile" : "Inactive profile"}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving
                ? "Saving..."
                : editId
                  ? "Update Customer"
                  : "Add Customer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
