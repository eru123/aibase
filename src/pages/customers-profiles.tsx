import { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  Input,
  DataTable,
  DropdownMenuItem,
  confirmModal,
} from "@/components/ui";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  is_active: number | boolean;
  created_at?: string;
}

export default function CustomersProfilesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, loading, pagination, handlePageChange, handleSearch, refresh } =
    usePaginatedApi<CustomerProfile>("/api/customers/profiles", {
      initialLimit: 10,
    });

  const createProfile = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/api/customers/profiles", { name, email });
      setName("");
      setEmail("");
      toast.success("Customer added");
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const removeProfile = async (row: CustomerProfile) => {
    const confirmed = await confirmModal({
      title: "Delete customer",
      message: `Delete ${row.name}?`,
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
      { header: "Name", accessorKey: "name" as const },
      { header: "Email", accessorKey: "email" as const },
      {
        header: "Status",
        cell: (row: CustomerProfile) => (row.is_active ? "Active" : "Inactive"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Profiles</h2>
        <p className="text-sm text-gray-500">Manage customer name and email records.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={createProfile} disabled={saving}>{saving ? "Saving..." : "Add Customer"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <DataTable
            data={data}
            columns={columns}
            isLoading={loading}
            page={pagination.page}
            total={pagination.total}
            onPageChange={handlePageChange}
            onSearchChange={handleSearch}
            actions={(row: CustomerProfile) => (
              <DropdownMenuItem className="text-destructive" onClick={() => removeProfile(row)}>
                Delete
              </DropdownMenuItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
