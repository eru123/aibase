import { useMemo, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CopyableBlock,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Modal,
  DropdownMenuItem,
  type Column,
} from "@/components/ui";
import { Eye, Trash2, Search, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePaginatedApi } from "@/hooks/usePaginatedApi";
import { Temporal } from "@js-temporal/polyfill";
import axios from "axios";
import { toast } from "sonner";

type ErrorLogEntry = {
  id: number;
  request?: Record<string, any> | null;
  data?: Record<string, any> | null;
  created_at?: string;
};

export default function ErrorLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedLog, setSelectedLog] = useState<ErrorLogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonQuery, setJsonQuery] = useState("");
  const [jsonQueryInput, setJsonQueryInput] = useState("");

  const yesterday = Temporal.Now.plainDateISO()
    .subtract({ days: 1 })
    .toString();
  const tomorrow = Temporal.Now.plainDateISO().add({ days: 1 }).toString();

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
  } = usePaginatedApi<ErrorLogEntry>("/api/error-logs", {
    initialLimit: 10,
    initialFilters: {
      from_date: yesterday,
      to_date: tomorrow,
    },
  });

  // ── Filter value mapping ──────────────────────────────────────
  const filterValues = useMemo(() => {
    const values: Record<string, any> = {};

    if (params.filters?.from_date || params.filters?.to_date) {
      let endDate = params.filters.to_date;
      try {
        if (endDate) {
          endDate = Temporal.PlainDate.from(endDate)
            .subtract({ days: 1 })
            .toString();
        }
      } catch {
        // fallback
      }
      values.created_at = [params.filters.from_date, endDate];
    }

    return values;
  }, [params]);

  const tableFilters = useMemo(
    () => [
      {
        label: "Time Range",
        value: "created_at",
        type: "daterange" as const,
        searchOnChanged: false,
      },
    ],
    [],
  );

  const handleTableFilterChange = (_key: string, _value: any) => {
    // single filter handled by batch
  };

  const handleBatchTableFilterChange = (updates: Record<string, any>) => {
    const nextFilters: any = { ...params.filters };

    Object.entries(updates).forEach(([key, value]) => {
      if (key === "created_at") {
        const [start, end] = value as [string | undefined, string | undefined];
        nextFilters.from_date = start ? start.split("T")[0] : "";
        if (end) {
          const endDateStr = end.split("T")[0];
          try {
            nextFilters.to_date = Temporal.PlainDate.from(endDateStr)
              .add({ days: 1 })
              .toString();
          } catch {
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
    setJsonQuery("");
    setJsonQueryInput("");
    applyFilters({});
  };

  const handleViewDetails = (log: ErrorLogEntry) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const handleDelete = useCallback(
    async (log: ErrorLogEntry) => {
      if (!confirm("Delete this error log entry?")) return;
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/error-logs/${log.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Error log deleted");
        refresh();
      } catch {
        toast.error("Failed to delete error log");
      }
    },
    [refresh],
  );

  const handleJsonQuerySubmit = () => {
    const trimmed = jsonQueryInput.trim();
    setJsonQuery(trimmed);
    applyFilters({ ...params.filters, json_query: trimmed });
  };

  const handleClearJsonQuery = () => {
    setJsonQuery("");
    setJsonQueryInput("");
    const next = { ...params.filters };
    delete next.json_query;
    applyFilters(next);
  };

  const rows = useMemo(() => data || [], [data]);

  const columns = useMemo<Column<ErrorLogEntry>[]>(
    () => [
      {
        header: "ID",
        cell: (log) => (
          <span className="text-xs font-mono text-gray-500">#{log.id}</span>
        ),
      },
      {
        header: "Time",
        cell: (log) => (
          <span className="text-xs text-gray-600">
            {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
          </span>
        ),
      },
      {
        header: "Type",
        cell: (log) => {
          const type = log.data?.type || "unknown";
          return (
            <Badge variant="outline">{String(type).replace(/_/g, " ")}</Badge>
          );
        },
      },
      {
        header: "Error",
        cell: (log) => {
          const msg = log.data?.error?.message || "-";
          return (
            <span
              className="text-xs text-red-600 max-w-[300px] truncate block"
              title={String(msg)}
            >
              {String(msg)}
            </span>
          );
        },
      },
      {
        header: "Method",
        cell: (log) => {
          const method = log.request?.method || "-";
          return (
            <Badge
              variant={
                method === "POST"
                  ? "subtle"
                  : method === "DELETE"
                    ? "destructive"
                    : "outline"
              }
            >
              {String(method)}
            </Badge>
          );
        },
      },
      {
        header: "URL",
        cell: (log) => (
          <span className="text-xs text-gray-600 max-w-[200px] truncate block font-mono">
            {log.request?.url || "-"}
          </span>
        ),
      },
    ],
    [],
  );

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Error Logs</h2>
          <p className="text-sm text-gray-600">
            Error logs are available to administrators only.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">
              You do not have permission to view error logs. Please contact an
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
          Error Logs
        </h2>
        <p className="text-sm text-gray-500">
          Captured errors from mail sending and other operations.
          <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
            {pagination.total} total entries
          </span>
        </p>
      </div>

      {/* JSON Query Bar */}
      <Card>
        <CardContent className="p-4">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            JSON Search Query
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="json-query-input"
                type="text"
                placeholder={`e.g.  data->>"$.type" = "email_send_failure"`}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={jsonQueryInput}
                onChange={(e) => setJsonQueryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJsonQuerySubmit();
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleJsonQuerySubmit}
              disabled={!jsonQueryInput.trim()}
            >
              <Search className="h-4 w-4 mr-1" />
              Run
            </Button>
            {jsonQuery && (
              <Button variant="ghost" size="sm" onClick={handleClearJsonQuery}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          {jsonQuery && (
            <p className="mt-1.5 text-xs text-gray-500">
              Active query:{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-primary">
                {jsonQuery}
              </code>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading error logs…</p>
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
                  <DropdownMenuItem
                    onClick={() => handleDelete(row)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <span className="flex items-center">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Error Log #{selectedLog?.id}
            </h3>
          </div>

          {/* Basic info table */}
          <div className="rounded-md border border-gray-200">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">ID</TableCell>
                  <TableCell className="text-sm font-mono">
                    {selectedLog?.id}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Time</TableCell>
                  <TableCell className="text-sm">
                    {selectedLog?.created_at
                      ? new Date(selectedLog.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Method</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline">
                      {selectedLog?.request?.method || "-"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">URL</TableCell>
                  <TableCell className="text-sm font-mono break-all">
                    {selectedLog?.request?.url || "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">IP</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {selectedLog?.request?.ip || "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Error Type</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="destructive">
                      {selectedLog?.data?.type || "unknown"}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Error Message</TableCell>
                  <TableCell className="text-sm text-red-600 break-all">
                    {selectedLog?.data?.error?.message || "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Request JSON */}
          {selectedLog?.request && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">
                Request Info
              </h4>
              <CopyableBlock
                value={JSON.stringify(selectedLog.request, null, 2)}
              >
                <div className="rounded-md border border-gray-200 p-3 bg-gray-100/50">
                  <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.request, null, 2)}
                  </pre>
                </div>
              </CopyableBlock>
            </div>
          )}

          {/* Data JSON */}
          {selectedLog?.data && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Error Data</h4>
              <CopyableBlock value={JSON.stringify(selectedLog.data, null, 2)}>
                <div className="rounded-md border border-red-200 p-3 bg-red-50/30">
                  <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.data, null, 2)}
                  </pre>
                </div>
              </CopyableBlock>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedLog) {
                  handleDelete(selectedLog);
                  setIsModalOpen(false);
                }
              }}
            >
              Delete
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
