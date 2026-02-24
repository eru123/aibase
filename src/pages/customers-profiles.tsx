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
  });
  const [saving, setSaving] = useState(false);

  const { data, loading, pagination, handlePageChange, handleSearch, refresh } =
    usePaginatedApi<CustomerProfile>("/api/customers/profiles", {
      initialLimit: 10,
    });

  const openCreate = () => {
    setEditId(null);
    setForm({
      first_name: "",
      middle_name: "",
      last_name: "",
      company_name: "",
      phone: "",
      email: "",
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
        <CardContent className="p-0">
          <DataTable
            data={data}
            columns={columns}
            isLoading={loading}
            page={pagination.page}
            total={pagination.total}
            onPageChange={handlePageChange}
            onSearchChange={handleSearch}
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
