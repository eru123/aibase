import { useMemo, useState } from "react";
import axios from "axios";
import { goeyToast as toast } from "goey-toast";
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

type CustomerGroup = {
  id: number;
  name: string;
  description?: string;
  members_count: number;
};

export default function CustomersGroupsPage() {
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState("");

  const groupsApi = usePaginatedApi<CustomerGroup>("/api/customers/groups", {
    initialLimit: 10,
  });

  const createGroup = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    const ids = memberIds
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    await axios.post("/api/customers/groups", { name, member_ids: ids });
    toast.success("Group created");
    setName("");
    setMemberIds("");
    groupsApi.refresh();
  };

  const remove = async (row: CustomerGroup) => {
    const confirmed = await confirmModal({ title: "Delete group", message: `Delete ${row.name}?`, type: "danger" });
    if (!confirmed) return;
    await axios.delete(`/api/customers/groups/${row.id}`);
    toast.success("Group removed");
    groupsApi.refresh();
  };

  const columns = useMemo(
    () => [
      { header: "Group", accessorKey: "name" as const },
      { header: "Members", cell: (row: CustomerGroup) => row.members_count },
      { header: "Description", accessorKey: "description" as const },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Groups</h2>
        <p className="text-sm text-gray-500">Create recipient groups for marketing campaigns.</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" />
            <Input value={memberIds} onChange={(e) => setMemberIds(e.target.value)} placeholder="Member IDs (1,2,3)" />
            <Button onClick={createGroup}>Create Group</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <DataTable
            data={groupsApi.data}
            columns={columns}
            isLoading={groupsApi.loading}
            page={groupsApi.pagination.page}
            total={groupsApi.pagination.total}
            onPageChange={groupsApi.handlePageChange}
            onSearchChange={groupsApi.handleSearch}
            actions={(row: CustomerGroup) => (
              <DropdownMenuItem className="text-destructive" onClick={() => remove(row)}>
                Delete
              </DropdownMenuItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
