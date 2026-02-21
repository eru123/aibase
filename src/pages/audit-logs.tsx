import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CopyableBlock,
  CopyableCell,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Modal,
  DropdownMenuItem,
  type Column,
  Avatar,
} from "@/components/ui";
import { Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import { Temporal } from "@js-temporal/polyfill";

type AuditLogEntry = {
  id: string;
  user_id?: number | string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  changes?: Record<string, { from: any; to: any }>;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  user_email?: string | null;
  user_username?: string | null;
  user_avatar_url?: string | null;
};

const actionOptions = [
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "read", label: "Read" },
];

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = Temporal.Now.plainDateISO().toString();
  const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 }).toString();
  const yesterday = Temporal.Now.plainDateISO()
    .subtract({ days: 1 })
    .toString();

  const {
    data,
    pagination,
    loading,
    error,
    setPage,
    setLimit,
    setSearch,
    setFilters: applyFilters,
    params,
    refresh,
  } = usePaginatedApi<AuditLogEntry>("/api/audit-logs", {
    initialLimit: 5,
    initialFilters: {
      from_date: yesterday,
      to_date: tomorrow,
    },
  });

  // Convert API params to DataTable friendly filter values
  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};

    // Action filter (Set)
    if (params.filters?.action) {
      values.action = new Set(String(params.filters.action).split(","));
    }

    // Text inputs
    if (params.filters?.user_id) values.user_id = params.filters.user_id;
    if (params.filters?.resource_type)
      values.resource_type = params.filters.resource_type;
    if (params.filters?.resource_id)
      values.resource_id = params.filters.resource_id;

    // Date range filter (Tuple)
    if (params.filters?.from_date || params.filters?.to_date) {
      let endDate = params.filters.to_date;
      try {
        if (endDate) {
          endDate = Temporal.PlainDate.from(endDate)
            .subtract({ days: 1 })
            .toString();
        }
      } catch (e) {
        // Fallback or ignore if invalid date
      }
      values.created_at = [params.filters.from_date, endDate];
    }

    return values;
  }, [params]);

  const tableFilters = useMemo(
    () => [
      {
        label: "Action",
        value: "action",
        options: actionOptions,
        searchOnChanged: true,
      },
      {
        label: "User ID",
        value: "user_id",
        type: "input" as const,
        searchOnChanged: false,
      },
      {
        label: "Resource Type",
        value: "resource_type",
        type: "input" as const,
        searchOnChanged: false,
      },
      {
        label: "Resource ID",
        value: "resource_id",
        type: "input" as const,
        searchOnChanged: false,
      },
      {
        label: "Time Range",
        value: "created_at",
        type: "daterange" as const,
        searchOnChanged: false,
      },
    ],
    [],
  );

  const handleTableFilterChange = (key: string, value: any) => {
    const nextFilters: any = { ...params.filters };

    if (key === "action") {
      const selected = Array.from(value as Set<string>);
      nextFilters.action = selected.join(",");
      applyFilters(nextFilters);
    }
  };

  const handleBatchTableFilterChange = (updates: Record<string, any>) => {
    const nextFilters: any = { ...params.filters };

    Object.entries(updates).forEach(([key, value]) => {
      if (key === "action") {
        const selected = Array.from(value as Set<string>);
        nextFilters.action = selected.join(",");
      } else if (key === "created_at") {
        const [start, end] = value as [string | undefined, string | undefined];
        nextFilters.from_date = start ? start.split("T")[0] : "";
        if (end) {
          const endDateStr = end.split("T")[0];
          try {
            nextFilters.to_date = Temporal.PlainDate.from(endDateStr)
              .add({ days: 1 })
              .toString();
          } catch (e) {
            nextFilters.to_date = endDateStr;
          }
        } else {
          nextFilters.to_date = "";
        }
      } else {
        nextFilters[key] = value;
      }
    });

    applyFilters(nextFilters);
  };

  const handleReset = () => {
    applyFilters({});
  };

  const handleViewDetails = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return "null";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  const actionVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case "delete":
        return "destructive";
      case "update":
        return "outline";
      case "create":
        return "subtle";
      default:
        return "solid";
    }
  };

  const rows = useMemo(() => data || [], [data]);

  const columns = useMemo<Column<AuditLogEntry>[]>(
    () => [
      {
        header: "Time",
        cell: (log) => (
          <span className="text-xs text-gray-600">
            {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        header: "User",
        cell: (log) => (
          <div className="flex items-center gap-2">
            <Avatar
              src={log.user_avatar_url}
              fallback={log.user_username || log.user_email || "?"}
              size="sm"
            />
            <div>
              <div className="font-medium text-gray-900">
                <Link
                  to={`/u/${log.user_username || log.user_id}`}
                  className="hover:text-primary transition-colors"
                >
                  {log.user_username ||
                    log.user_email ||
                    `User ${log.user_id ?? "-"}`}
                </Link>
              </div>
              <div className="text-xs text-gray-500">
                {log.user_email ? (
                  <Link
                    to={`/u/${log.user_username || log.user_id}`}
                    className="hover:underline"
                  >
                    {log.user_email}
                  </Link>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Action",
        cell: (log) => (
          <Badge variant={actionVariant(log.action)}>
            {log.action.toUpperCase()}
          </Badge>
        ),
      },
      {
        header: "Resource",
        cell: (log) => (
          <span className="text-xs text-gray-600">
            {log.resource_type}
            {log.resource_id ? ` #${log.resource_id}` : ""}
          </span>
        ),
      },
    ],
    [actionVariant],
  );

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Audit Logs</h2>
          <p className="text-sm text-gray-600">
            Audit logs are available to administrators only.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to view audit logs. Please contact an
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
          Audit Logs
        </h2>
        <p className="text-sm text-gray-500">
          Track create, update, and delete activity across the system.
          <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            {pagination.total} total events
          </span>
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading audit logs...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <DataTable
              data={rows}
              columns={columns}
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              searchKey="search"
              searchValue={params.search || ""}
              onSearchChange={setSearch}
              filters={tableFilters}
              filterValues={filterValues}
              onFilterChange={handleTableFilterChange}
              onBatchFilterChange={handleBatchTableFilterChange}
              onReset={handleReset}
              actions={(row) => (
                <DropdownMenuItem onClick={() => handleViewDetails(row)}>
                  <span className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" /> View Details
                  </span>
                </DropdownMenuItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Audit Log Details
            </h3>
          </div>

          <div className="rounded-md border border-gray-200">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">Time</TableCell>
                  <TableCell className="text-sm">
                    {selectedLog?.created_at
                      ? new Date(selectedLog.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Action</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        selectedLog
                          ? actionVariant(selectedLog.action)
                          : "solid"
                      }
                    >
                      {selectedLog?.action}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">User</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={selectedLog?.user_avatar_url}
                        fallback={
                          selectedLog?.user_username ||
                          selectedLog?.user_email ||
                          "?"
                        }
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          <Link
                            to={`/u/${selectedLog?.user_username || selectedLog?.user_id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {selectedLog?.user_username ||
                              selectedLog?.user_email ||
                              "Unknown"}
                          </Link>
                        </span>
                        {selectedLog?.user_email &&
                          selectedLog.user_email !==
                            selectedLog.user_username && (
                            <span className="text-xs text-gray-500">
                              <Link
                                to={`/u/${selectedLog?.user_username || selectedLog?.user_id}`}
                                className="hover:underline"
                              >
                                {selectedLog.user_email}
                              </Link>
                            </span>
                          )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resource Type</TableCell>
                  <TableCell className="text-sm">
                    {selectedLog?.resource_type || "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Resource ID</TableCell>
                  <TableCell className="text-sm">
                    {selectedLog?.resource_id || "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IP Address</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {selectedLog?.ip_address || "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">User Agent</TableCell>
                  <TableCell className="text-[11px] text-gray-500 break-all">
                    {selectedLog?.user_agent || "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {selectedLog?.changes &&
            Object.keys(selectedLog.changes).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Changes</h4>
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <Table>
                    <TableBody>
                      <TableRow className="bg-gray-50/50">
                        <TableCell className="py-2 text-xs font-semibold">
                          Field
                        </TableCell>
                        <TableCell className="py-2 text-xs font-semibold">
                          Before
                        </TableCell>
                        <TableCell className="py-2 text-xs font-semibold">
                          After
                        </TableCell>
                      </TableRow>
                      {Object.entries(selectedLog.changes).map(
                        ([field, diff]) => (
                          <TableRow key={field}>
                            <TableCell className="py-2 text-xs font-medium capitalize border-r whitespace-nowrap">
                              {field.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="py-2 text-xs text-red-600 bg-red-50/20 border-r break-all max-w-[150px]">
                              <CopyableCell
                                value={formatValue((diff as any).from)}
                              >
                                {formatValue((diff as any).from)}
                              </CopyableCell>
                            </TableCell>
                            <TableCell className="py-2 text-xs text-green-600 bg-green-50/20 break-all max-w-[150px]">
                              <CopyableCell
                                value={formatValue((diff as any).to)}
                              >
                                {formatValue((diff as any).to)}
                              </CopyableCell>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

          {selectedLog?.metadata &&
            Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Metadata</h4>
                <CopyableBlock
                  value={JSON.stringify(selectedLog.metadata, null, 2)}
                >
                  <div className="rounded-md border border-gray-200 p-3 bg-gray-100/50">
                    <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </CopyableBlock>
              </div>
            )}

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
