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
  CopyableCell,
  DataTable,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Column,
  Modal,
  DropdownMenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Avatar,
} from "@/components/ui";
import { Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import { Temporal } from "@js-temporal/polyfill";

type AuthLogEntry = {
  id: number | string;
  user_id?: number | string | null;
  action: string;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: any;
  created_at?: string;
  user_email?: string | null;
  user_username?: string | null;
  user_avatar_url?: string | null;
};

const actionOptions = [
  { value: "", label: "All actions" },
  { value: "login_success", label: "Login success" },
  { value: "login_failed", label: "Login failed" },
  { value: "logout", label: "Logout" },
  { value: "register", label: "Register" },
  { value: "password_reset", label: "Password reset" },
];

export default function AuthenticationLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [filters, setFilters] = useState({
    action: "",
    user_id: "",
    ip_address: "",
    from_date: "",
    to_date: "",
  });

  const [selectedLog, setSelectedLog] = useState<AuthLogEntry | null>(null);
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
  } = usePaginatedApi<AuthLogEntry>("/api/authentication-logs", {
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
        options: actionOptions.filter((o) => o.value !== ""), // Remove "All actions" placeholder
        searchOnChanged: true,
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
    // Start with current filters
    const nextFilters: any = { ...params.filters };

    if (key === "action") {
      // Convert Set to comma-separated string
      const selected = Array.from(value as Set<string>);
      nextFilters.action = selected.join(",");
    } else if (key === "created_at") {
      // Handle date range
      const [start, end] = value as [string | undefined, string | undefined];
      // Ensure we only send the date part (YYYY-MM-DD), stripping any time component
      nextFilters.from_date = start ? start.split("T")[0] : "";

      // For to_date, we need to add 1 day to make the filter inclusive of the selected end date
      // because the backend likely filters as < to_date (midnight)
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
    }

    // Pass the flat filters object to applyFilters
    applyFilters(nextFilters);
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
      }
    });

    applyFilters(nextFilters);
  };

  const handleReset = () => {
    applyFilters({});
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

  const formatDetails = (details: any) => {
    if (!details) {
      return "-";
    }
    const text = formatValue(details);
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  };

  const rows = useMemo(() => data || [], [data]);

  const columns = useMemo<Column<AuthLogEntry>[]>(() => {
    const baseColumns: Column<AuthLogEntry>[] = [
      {
        header: "Time",
        cell: (log) => (
          <span className="text-xs text-gray-600">
            {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
          </span>
        ),
      },
    ];

    if (isAdmin) {
      baseColumns.push({
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
      });
    }

    baseColumns.push(
      {
        header: "Action",
        cell: (log) => <Badge variant="outline">{log.action}</Badge>,
      },
      {
        header: "IP",
        cell: (log) => (
          <span className="text-xs text-gray-600">{log.ip_address || "-"}</span>
        ),
      },
    );

    return baseColumns;
  }, [isAdmin]);

  const handleViewDetails = (log: AuthLogEntry) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Authentication Logs
        </h2>
        <p className="text-sm text-gray-500">
          {isAdmin
            ? "Track login activity across all users."
            : "Review your recent sign-in activity."}
          <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            {pagination.total} total events
          </span>
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading logs...</p>
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
                <>
                  <DropdownMenuItem onClick={() => handleViewDetails(row)}>
                    <span className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            />
          )}
        </CardContent>
      </Card>

      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Authentication Log Details
            </h3>
          </div>

          <div className="rounded-md border border-gray-200">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">Time</TableCell>
                  <TableCell>
                    <CopyableCell
                      value={
                        selectedLog?.created_at
                          ? new Date(selectedLog.created_at).toLocaleString()
                          : "-"
                      }
                    >
                      {selectedLog?.created_at
                        ? new Date(selectedLog.created_at).toLocaleString()
                        : "-"}
                    </CopyableCell>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Action</TableCell>
                  <TableCell>
                    <Badge variant="outline">{selectedLog?.action}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">User</TableCell>
                  <TableCell>
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
                  <TableCell className="font-medium">IP Address</TableCell>
                  <TableCell>
                    <CopyableCell value={selectedLog?.ip_address || "-"}>
                      {selectedLog?.ip_address || "-"}
                    </CopyableCell>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">User Agent</TableCell>
                  <TableCell className="text-xs text-gray-600 break-all">
                    <CopyableCell value={selectedLog?.user_agent || "-"}>
                      {selectedLog?.user_agent || "-"}
                    </CopyableCell>
                  </TableCell>
                </TableRow>

                {selectedLog?.details &&
                typeof selectedLog.details === "object" ? (
                  Object.entries(selectedLog.details).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="text-sm">
                        <CopyableCell
                          value={
                            typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)
                          }
                        >
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </CopyableCell>
                      </TableCell>
                    </TableRow>
                  ))
                ) : selectedLog?.details ? (
                  <TableRow>
                    <TableCell className="font-medium">Details</TableCell>
                    <TableCell className="text-sm">
                      <CopyableCell value={String(selectedLog.details)}>
                        {String(selectedLog.details)}
                      </CopyableCell>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
