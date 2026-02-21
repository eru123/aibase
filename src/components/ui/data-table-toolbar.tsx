
import { X, Search, SlidersHorizontal } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTablePriceFilter } from "./data-table-price-filter"
import { DataTableDateFilter } from "./data-table-date-filter"
import { DataTableTimeRangeFilter } from "./data-table-time-range-filter"
import { DataTableNumberRangeFilter } from "./data-table-number-range-filter"
import { Separator } from "./separator"

export interface FilterOption {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
}

export interface DataTableFilterField<TData> {
    label: string
    value: keyof TData | string
    type?: 'select' | 'price-range' | 'daterange' | 'time-range' | 'number-range' | 'input' | 'separator' // NEW: support different filter types
    options?: FilterOption[]
    searchOnChanged?: boolean
}

interface DataTableToolbarProps<TData> {
    searchKey?: string
    searchValue?: string
    onSearchChange?: (value: string) => void
    filters?: DataTableFilterField<TData>[]
    filterValues?: Record<string, any> // key: column, value: selected values (Set or [min, max])
    onFilterChange?: (key: string, values: any) => void
    onBatchFilterChange?: (updates: Record<string, any>) => void
    onReset?: () => void
}

export function DataTableToolbar<TData>({
    searchKey,
    searchValue,
    onSearchChange,
    filters,
    filterValues,
    onFilterChange,
    onBatchFilterChange,
    onReset,
}: DataTableToolbarProps<TData>) {
    const [inputValue, setInputValue] = useState(searchValue ?? "")
    const [localFilterValues, setLocalFilterValues] = useState<Record<string, any>>(filterValues ?? {})
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        setInputValue(searchValue ?? "")
    }, [searchValue])

    useEffect(() => {
        setLocalFilterValues(filterValues ?? {})
    }, [filterValues])

    const hasActiveFilters = (values?: Record<string, any>) => {
        if (!values) return false
        return Object.values(values).some((value) => {
            if (value instanceof Set) return value.size > 0
            if (Array.isArray(value)) {
                return value.some((entry) => entry !== undefined && entry !== null && entry !== "")
            }
            if (typeof value === "string") return value.trim().length > 0
            return value !== undefined && value !== null
        })
    }

    const isFiltered = hasActiveFilters(filterValues) || (!!searchValue && searchValue.length > 0)

    const handleReset = () => {
        setInputValue("")
        if (onReset) {
            onReset()
            return
        }

        if (onSearchChange) {
            onSearchChange("")
        }
        if (onFilterChange && filters) {
            filters.forEach(f => {
                if (f.type === 'price-range' || f.type === 'daterange' || f.type === 'time-range' || f.type === 'number-range') {
                    onFilterChange(String(f.value), [undefined, undefined])
                } else {
                    onFilterChange(String(f.value), new Set())
                }
            })
        }
    }

    const handleFilterChangeInternal = (key: string, value: any) => {
        const filter = filters?.find(f => String(f.value) === key)
        const nextFilters = { ...localFilterValues, [key]: value }

        setLocalFilterValues(nextFilters)

        if (filter?.searchOnChanged) {
            onFilterChange?.(key, value)
        }
    }

    const handleSearch = () => {
        onSearchChange?.(inputValue)
        if (onBatchFilterChange) {
            onBatchFilterChange(localFilterValues)
        }
    }

    return (
        <div className="flex flex-col space-y-4">
            {/* Top Row: Search */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                {searchKey && (
                    <div className="flex w-full flex-wrap items-center gap-2 md:max-w-lg">
                        <Input
                            placeholder="Filter..."
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    handleSearch()
                                }
                            }}
                            className="h-8 w-full min-w-[180px] flex-1"
                        />
                        {isFiltered && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleReset}
                                className="h-8 border border-dashed border-border text-muted-foreground"
                            >
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={handleSearch}
                        >
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Search</span>
                        </Button>
                    </div>
                )}
                {/* Mobile Filter Toggle */}
                {filters && filters.length > 0 && (
                    <div className="flex md:hidden">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 ml-auto"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* Bottom Row: Filters (Desktop) */}
            <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2">
                {filters?.map((filter) => {
                    if (filter.type === 'price-range') {
                        return (
                            <DataTablePriceFilter
                                key={String(filter.value)}
                                title={filter.label}
                                value={localFilterValues?.[String(filter.value)] as [number | undefined, number | undefined]}
                                onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                            />
                        )
                    }
                    if (filter.type === 'daterange') {
                        return (
                            <DataTableDateFilter
                                key={String(filter.value)}
                                title={filter.label}
                                value={localFilterValues?.[String(filter.value)] as [string | undefined, string | undefined]}
                                onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                            />
                        )
                    }
                    if (filter.type === 'time-range') {
                        return (
                            <DataTableTimeRangeFilter
                                key={String(filter.value)}
                                title={filter.label}
                                value={localFilterValues?.[String(filter.value)] as [string | undefined, string | undefined]}
                                onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                            />
                        )
                    }
                    if (filter.type === 'number-range') {
                        return (
                            <DataTableNumberRangeFilter
                                key={String(filter.value)}
                                title={filter.label}
                                value={localFilterValues?.[String(filter.value)] as [number | undefined, number | undefined]}
                                onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                            />
                        )
                    }
                    if (filter.type === 'input') {
                        return (
                            <div key={String(filter.value)} className="flex flex-col gap-1">
                                <div className="flex h-8 items-center rounded-md border bg-background px-2 text-sm border-border">
                                    <span className="mr-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {filter.label}
                                    </span>
                                    <Input
                                        value={localFilterValues?.[String(filter.value)] || ""}
                                        onChange={(e) => handleFilterChangeInternal(String(filter.value), e.target.value)}
                                        className="h-7 w-32 border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                                        placeholder={`Filter ${filter.label}...`}
                                    />
                                </div>
                                <div className="h-5" aria-hidden="true" />
                            </div>
                        )
                    }
                    if (filter.type === 'separator') {
                        return <Separator key={String(filter.value)} className="my-2" />
                    }
                    // Default to faceted select
                    return (
                        <DataTableFacetedFilter
                            key={String(filter.value)}
                            title={filter.label}
                            options={filter.options || []}
                            selectedValues={new Set(localFilterValues?.[String(filter.value)] as string[])}
                            onSelect={(values) => handleFilterChangeInternal(String(filter.value), values)}
                        />
                    )
                })}
            </div>

            {/* Mobile Filter Area */}
            {showFilters && filters && filters.length > 0 && (
                <div className="rounded-md border border-dashed p-4 md:hidden space-y-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Filters</h4>
                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs text-muted-foreground"
                                onClick={handleReset}
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {filters.map((filter) => {
                            if (filter.type === 'price-range') {
                                return (
                                    <DataTablePriceFilter
                                        key={String(filter.value)}
                                        title={filter.label}
                                        value={localFilterValues?.[String(filter.value)] as [number | undefined, number | undefined]}
                                        onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                                    />
                                )
                            }
                            if (filter.type === 'daterange') {
                                return (
                                    <DataTableDateFilter
                                        key={String(filter.value)}
                                        title={filter.label}
                                        value={localFilterValues?.[String(filter.value)] as [string | undefined, string | undefined]}
                                        onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                                    />
                                )
                            }
                            if (filter.type === 'time-range') {
                                return (
                                    <DataTableTimeRangeFilter
                                        key={String(filter.value)}
                                        title={filter.label}
                                        value={localFilterValues?.[String(filter.value)] as [string | undefined, string | undefined]}
                                        onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                                    />
                                )
                            }
                            if (filter.type === 'number-range') {
                                return (
                                    <DataTableNumberRangeFilter
                                        key={String(filter.value)}
                                        title={filter.label}
                                        value={localFilterValues?.[String(filter.value)] as [number | undefined, number | undefined]}
                                        onChange={(value) => handleFilterChangeInternal(String(filter.value), value)}
                                    />
                                )
                            }
                            if (filter.type === 'input') {
                                return (
                                    <div key={String(filter.value)} className="flex flex-col gap-1">
                                        <div className="flex h-8 items-center rounded-md border bg-background px-2 text-sm border-border">
                                            <span className="mr-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                                {filter.label}
                                            </span>
                                            <Input
                                                value={localFilterValues?.[String(filter.value)] || ""}
                                                onChange={(e) => handleFilterChangeInternal(String(filter.value), e.target.value)}
                                                className="h-7 w-full border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                                                placeholder={`Filter ${filter.label}...`}
                                            />
                                        </div>
                                        <div className="h-5" aria-hidden="true" />
                                    </div>
                                )
                            }
                            if (filter.type === 'separator') {
                                return <Separator key={String(filter.value)} className="my-1" />
                            }
                            return (
                                <DataTableFacetedFilter
                                    key={String(filter.value)}
                                    title={filter.label}
                                    options={filter.options || []}
                                    selectedValues={new Set(localFilterValues?.[String(filter.value)] as string[])}
                                    onSelect={(values) => handleFilterChangeInternal(String(filter.value), values)}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

