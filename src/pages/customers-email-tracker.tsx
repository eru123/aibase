import { useMemo } from "react";
import { Badge, Card, CardContent, DataTable } from "@/components/ui";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";

type EmailRequest = {
  id: number;
  template_name: string;
  group_name?: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

export default function CustomersEmailTrackerPage() {
  const api = usePaginatedApi<EmailRequest>("/api/customers/marketing-emails/requests", { initialLimit: 10 });

  const columns = useMemo(() => [
    { header: "ID", accessorKey: "id" as const },
    { header: "Template", accessorKey: "template_name" as const },
    { header: "Group", cell: (row: EmailRequest) => row.group_name || "-" },
    { header: "Recipients", accessorKey: "total_recipients" as const },
    { header: "Status", cell: (row: EmailRequest) => <Badge variant={row.status === "sent" ? "subtle" : "outline"}>{row.status}</Badge> },
    { header: "Sent/Failed", cell: (row: EmailRequest) => `${row.sent_count}/${row.failed_count}` },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Email Tracker</h2>
        <p className="text-sm text-gray-500">Track queued marketing email requests and delivery status.</p>
      </div>
      <Card>
        <CardContent className="p-6">
          <DataTable data={api.data} columns={columns} isLoading={api.loading} page={api.pagination.page} total={api.pagination.total} onPageChange={api.handlePageChange} onSearchChange={api.handleSearch} />
        </CardContent>
      </Card>
    </div>
  );
}
