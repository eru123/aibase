import * as React from "react"
import { ArrowUpDown, MoreVertical, Loader2 } from "lucide-react"

import { cn } from "@/components/ui/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar, DataTableFilterField } from "./data-table-toolbar"

export interface Column<T> {
    header: React.ReactNode
    accessorKey?: keyof T
    cell?: (row: T) => React.ReactNode
    className?: string
    enableSorting?: boolean
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    selectable?: boolean
    selectedIds?: (string | number)[]
    onSelectionChange?: (selectedIds: (string | number)[]) => void
    keyField?: keyof T
    actions?: (row: T) => React.ReactNode
    onRowClick?: (row: T) => void
    className?: string
    // Sorting
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    onSortingChange?: (column: string, direction: 'asc' | 'desc') => void
    // Pagination
    page?: number
    limit?: number
    total?: number
    onPageChange?: (page: number) => void
    onPageSizeChange?: (limit: number) => void
    // Filtering
    searchKey?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    filters?: DataTableFilterField<T>[]
    filterValues?: Record<string, any>
    onFilterChange?: (key: string, values: any) => void
    onBatchFilterChange?: (updates: Record<string, any>) => void
    onReset?: () => void
    isLoading?: boolean
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    keyField = "id",
    actions,
    onRowClick,
    className,
    sortColumn,
    sortDirection,
    onSortingChange,
    page = 1,
    limit = 5,
    total = 0,
    onPageChange,
    onPageSizeChange,
    searchKey,
    searchValue,
    onSearchChange,
    filters,
    filterValues,
    onFilterChange,
    onBatchFilterChange,
    onReset,
    isLoading,
}: DataTableProps<T>) {
    const handleSelectAll = () => {
        if (!onSelectionChange) return
        if (selectedIds.length === data.length && data.length > 0) {
            onSelectionChange([])
        } else {
            onSelectionChange(data.map((row) => row[keyField]))
        }
    }

    const handleSelectRow = (id: string | number) => {
        if (!onSelectionChange) return
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter((sid) => sid !== id)
            : [...selectedIds, id]
        onSelectionChange(newSelected)
    }

    const isAllSelected = data.length > 0 && selectedIds.length === data.length
    const isIndeterminate =
        selectedIds.length > 0 && selectedIds.length < data.length

    const handleSort = (column: string) => {
        if (!onSortingChange) return

        if (sortColumn === column) {
            onSortingChange(column, sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            onSortingChange(column, 'asc')
        }
    }

    const pageCount = Math.ceil((total || 0) / (limit || 1))

    return (
        <div className="space-y-4">
            <DataTableToolbar
                searchKey={searchKey}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                filters={filters}
                filterValues={filterValues}
                onFilterChange={onFilterChange}
                onBatchFilterChange={onBatchFilterChange}
                onReset={onReset}
            />
            <div className={cn("w-full overflow-hidden rounded-md border border-border/70", className)}>
                <div className="w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                {selectable && (
                                    <TableHead className="sticky left-0 z-20 w-[40px] px-4 bg-muted/50 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={isAllSelected}
                                                ref={(input) => {
                                                    if (input) {
                                                        input.indeterminate = isIndeterminate
                                                    }
                                                }}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </TableHead>
                                )}
                                {columns.map((col, i) => (
                                    <TableHead key={i} className={col.className}>
                                        {col.enableSorting && col.accessorKey && onSortingChange ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="-ml-3 h-8 data-[state=open]:bg-accent"
                                                onClick={() => handleSort(col.accessorKey as string)}
                                            >
                                                {col.header}
                                                <ArrowUpDown className={cn("ml-2 h-4 w-4", sortColumn === col.accessorKey ? "opacity-100" : "opacity-0")} />
                                            </Button>
                                        ) : (
                                            col.header
                                        )}
                                    </TableHead>
                                ))}
                                {actions && <TableHead className="sticky right-0 z-20 w-[50px] bg-muted/50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                                        }
                                        className="h-24 text-center"
                                    >
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={
                                            columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)
                                        }
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, i) => {
                                    const id = row[keyField]
                                    const isSelected = selectedIds.includes(id)

                                    return (
                                        <TableRow
                                            key={id ?? i}
                                            data-state={isSelected ? "selected" : undefined}
                                            className={cn(
                                                "group",
                                                onRowClick ? "cursor-pointer" : "",
                                                isSelected ? "bg-muted/40" : ""
                                            )}
                                            onClick={(e) => {
                                                // Prevent row click if clicking checkbox or actions
                                                if (
                                                    (e.target as HTMLElement).closest("input[type='checkbox']") ||
                                                    (e.target as HTMLElement).closest("button")
                                                ) {
                                                    return
                                                }
                                                onRowClick?.(row)
                                            }}
                                        >
                                            {selectable && (
                                                <TableCell className="sticky left-0 z-10 bg-background transition-colors group-hover:bg-muted/50 group-data-[state=selected]:bg-muted px-4 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(id)}
                                                        />
                                                    </div>
                                                </TableCell>
                                            )}
                                            {columns.map((col, j) => (
                                                <TableCell key={j} className={col.className}>
                                                    {col.cell
                                                        ? col.cell(row)
                                                        : col.accessorKey
                                                            ? row[col.accessorKey]
                                                            : null}
                                                </TableCell>
                                            ))}
                                            {actions && (
                                                <TableCell className="sticky right-0 z-10 bg-background transition-colors group-hover:bg-muted/50 group-data-[state=selected]:bg-muted shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                                                    <DropdownMenu align="end">
                                                        <DropdownMenuTrigger className="ui-button ui-button-ghost h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent portal>
                                                            {actions(row)}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {total > 0 && onPageChange && onPageSizeChange && (
                <DataTablePagination
                    pageIndex={page}
                    pageSize={limit}
                    pageCount={pageCount}
                    total={total}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                />
            )}
        </div>
    )
}
