
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DataTablePaginationProps {
    pageIndex: number
    pageSize: number
    pageCount: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
}

export function DataTablePagination({
    pageIndex,
    pageSize,
    pageCount,
    total,
    onPageChange,
    onPageSizeChange,
}: DataTablePaginationProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-2">
            {/* Mobile Row 1: Showing text + Page Selector */}
            <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex-1 text-sm text-muted-foreground mr-4">
                    {total > 0 ? (
                        <>
                            Showing {((pageIndex - 1) * pageSize) + 1} to {Math.min(pageIndex * pageSize, total)} of {total} entries
                        </>
                    ) : (
                        "No entries found"
                    )}
                </div>
                {/* Mobile Page Selector */}
                <div className="flex items-center space-x-2 md:hidden">
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            onPageSizeChange(Number(value))
                            onPageChange(1)
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 20, 30, 40, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Mobile Row 2 / Desktop Right Side */}
            <div className="flex items-center justify-between w-full md:w-auto md:space-x-6 lg:space-x-8">
                {/* Desktop Page Selector */}
                <div className="hidden items-center space-x-2 md:flex">
                    <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            onPageSizeChange(Number(value))
                            onPageChange(1)
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 20, 30, 40, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {pageIndex} of {pageCount}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(1)}
                        disabled={pageIndex <= 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <span className="text-xs">&lt;&lt;</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(pageIndex - 1)}
                        disabled={pageIndex <= 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <span className="text-xs">&lt;</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => onPageChange(pageIndex + 1)}
                        disabled={pageIndex >= pageCount}
                    >
                        <span className="sr-only">Go to next page</span>
                        <span className="text-xs">&gt;</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => onPageChange(pageCount)}
                        disabled={pageIndex >= pageCount}
                    >
                        <span className="sr-only">Go to last page</span>
                        <span className="text-xs">&gt;&gt;</span>
                    </Button>
                </div>
            </div>
        </div>
    )
}
